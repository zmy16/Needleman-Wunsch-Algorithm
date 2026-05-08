(function initTheme() {
  const saved = localStorage.getItem("nw-theme") || "dark";
  applyTheme(saved, false);
})();

function applyTheme(theme, animate) {
  const html = document.documentElement;
  if (animate) {
    html.classList.add("theme-ready");
  } else {
    html.classList.remove("theme-ready");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => html.classList.add("theme-ready")),
    );
  }
  html.setAttribute("data-theme", theme);
  localStorage.setItem("nw-theme", theme);
  const icon = document.getElementById("themeIcon");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (theme === "light") {
    if (icon) icon.textContent = "☀️";
    if (meta) meta.setAttribute("content", "#f1f5f9");
  } else {
    if (icon) icon.textContent = "🌙";
    if (meta) meta.setAttribute("content", "#0a0f1e");
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark", true);
  showToast(
    document.documentElement.getAttribute("data-theme") === "light"
      ? "☀️ Light mode aktif"
      : "🌙 Dark mode aktif",
  );
}

const PRESETS = {
  kelompok4: { h: "CTACGCATC", v: "CAAGCCTAC", m: 2, mi: 1, g: -1 },
  simple: { h: "ACGT", v: "AGT", m: 2, mi: -1, g: -2 },
  gap: { h: "AGTACG", v: "ACATAG", m: 2, mi: 1, g: -1 },
  long: { h: "ATCGATCGATCG", v: "ATGCATGCATGC", m: 1, mi: -1, g: -2 },
};
function loadPreset(k) {
  const d = PRESETS[k];
  const seqH = $("inSeqH"),
    seqV = $("inSeqV");
  seqH.value = d.h;
  seqV.value = d.v;
  $("inMatch").value = d.m;
  $("inMis").value = d.mi;
  $("inGap").value = d.g;
  validateSeq(seqH, "hintH");
  validateSeq(seqV, "hintV");
}

function validateSeq(input, hintId) {
  const raw = input.value.toUpperCase();
  const clean = raw.replace(/[^ACGTN]/g, "");
  const hint = $(hintId);
  input.classList.remove("input-ok", "input-err");
  if (!raw) {
    hint.textContent = "";
    hint.className = "input-hint";
    return;
  }
  if (raw !== clean) {
    input.classList.add("input-err");
    hint.textContent = "Hanya huruf A, C, G, T, N yang diizinkan";
    hint.className = "input-hint err";
    return;
  }
  if (clean.length > 15) {
    input.classList.add("input-err");
    hint.textContent = "Maksimal 15 karakter";
    hint.className = "input-hint err";
    return;
  }
  input.classList.add("input-ok");
  hint.textContent = `${clean.length} basa — valid ✓`;
  hint.className = "input-hint ok";
}

let toastTimer;
function showToast(msg, duration = 2800) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), duration);
}

function openModal() {
  $("modal-overlay").classList.add("open");
}
function closeModal() {
  $("modal-overlay").classList.remove("open");
}
function confirmReset() {
  closeModal();
  _doReset();
}

let seqH, seqV, MATCH, MIS, GAP, rows, cols, matrix, steps, cur, tbPath;

const $ = (id) => document.getElementById(id);
const sign = (n) => (n >= 0 ? "+" + n : n);

// XSS protection: escape HTML entities
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function safeInt(id, fallback) {
  const v = parseInt(document.getElementById(id).value);
  return isNaN(v) ? fallback : v;
}

function generate() {
  const err = $("errMsg");
  const h = $("inSeqH")
    .value.toUpperCase()
    .replace(/[^ACGTN]/g, "");
  const v = $("inSeqV")
    .value.toUpperCase()
    .replace(/[^ACGTN]/g, "");
  if (!h || !v) {
    err.textContent = "Sekuens harus minimal 1 huruf (A/C/G/T)";
    err.style.display = "block";
    return;
  }
  if (h.length > 15 || v.length > 15) {
    err.textContent = "Maksimal 15 huruf agar matriks tetap terbaca";
    err.style.display = "block";
    return;
  }
  err.style.display = "none";
  seqH = h.split("");
  seqV = v.split("");
  MATCH = safeInt("inMatch", 2);
  MIS = safeInt("inMis", -1);
  GAP = safeInt("inGap", -2);
  rows = seqV.length + 1;
  cols = seqH.length + 1;
  cur = 0;
  tbPath = [];
  buildMatrix();
  renderUI();
}

function buildMatrix() {
  matrix = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ d: 0, t: 0, l: 0, m: 0 })),
  );
  steps = [];
  for (let j = 0; j < cols; j++) matrix[0][j].m = j * GAP;
  for (let i = 1; i < rows; i++) matrix[i][0].m = i * GAP;
  for (let i = 1; i < rows; i++)
    for (let j = 1; j < cols; j++) {
      const s = seqV[i - 1] === seqH[j - 1] ? MATCH : MIS;
      const d = matrix[i - 1][j - 1].m + s,
        t = matrix[i - 1][j].m + GAP,
        l = matrix[i][j - 1].m + GAP;
      const mx = Math.max(d, t, l);
      matrix[i][j] = { d, t, l, m: mx };
      steps.push({ i, j, d, t, l, mx, s, cv: seqV[i - 1], ch: seqH[j - 1] });
    }
  tbPath = [];
  let i = rows - 1,
    j = cols - 1;
  while (i > 0 || j > 0) {
    tbPath.push([i, j]);
    if (i > 0 && j > 0 && matrix[i][j].m === matrix[i][j].d) {
      i--;
      j--;
    } else if (i > 0 && matrix[i][j].m === matrix[i][j].t) {
      i--;
    } else {
      j--;
    }
  }
  tbPath.push([0, 0]);
}

function renderUI() {
  $("dyn").innerHTML = `
    <!-- SEQ BOX -->
    <div class="bcard b-seqbox">
      <div class="bcard-label">Sekuens</div>
      <div class="seq-display">
        <div class="seq-box">
          <div class="seq-lbl">Sekuens A (horizontal)</div>
          <div class="seq-letters">${seqH.map((c) => `<span>${escapeHTML(c)}</span>`).join("")}</div>
        </div>
        <div class="seq-box">
          <div class="seq-lbl">Sekuens B (vertikal)</div>
          <div class="seq-letters">${seqV.map((c) => `<span>${escapeHTML(c)}</span>`).join("")}</div>
        </div>
      </div>
    </div>

    <!-- PARAMS -->
    <div class="bcard b-params">
      <div class="bcard-label">Parameter Skor</div>
      <div class="params">
        <div class="pc"><div class="lbl">Match</div><div class="val match-c">${sign(MATCH)}</div></div>
        <div class="pc"><div class="lbl">Mismatch</div><div class="val mis-c">${sign(MIS)}</div></div>
        <div class="pc"><div class="lbl">Gap</div><div class="val gap-c">${sign(GAP)}</div></div>
        <div class="pc"><div class="lbl">Final Score</div><div class="val score-c" id="fs">—</div></div>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="bcard b-ctrl">
      <div class="bcard-label">Kontrol</div>
      <div class="inner-ctrl">
        <div class="ctrl-btns">
          <button class="btn btn-s"    id="btnReset" onclick="doReset()" aria-label="Reset matriks">↺ Reset</button>
          <button class="btn btn-prev" id="btnPrev"  onclick="doPrev()"  aria-label="Langkah mundur" disabled>◀ Mundur</button>
          <button class="btn btn-p"    id="btnStep"  onclick="doStep()"  aria-label="Langkah berikutnya">Langkah ▶</button>
          <button class="btn btn-p"    id="btnFill"  onclick="doFillBtn()"  aria-label="Isi semua sel">Isi Semua ⏩</button>
          <button class="btn btn-g"    id="btnTrace" onclick="doTrace()" aria-label="Jalankan traceback">Traceback 🔍</button>
        </div>
        <div class="step-info" id="si" aria-live="polite">Klik "Langkah ▶" untuk mulai</div>
      </div>
      <div class="progress-wrap"><div class="progress-bar" id="prog"></div></div>
      <div class="legend" style="margin-top:14px;">
        <div class="li"><div class="ld" style="background:var(--green)"></div>↖ Diagonal</div>
        <div class="li"><div class="ld" style="background:var(--red)"></div>↑ Atas (gap)</div>
        <div class="li"><div class="ld" style="background:var(--yellow)"></div>← Kiri (gap)</div>
        <div class="li"><div class="ld" style="background:var(--blue)"></div>★ MAX</div>
      </div>
    </div>

    <!-- MATRIX -->
    <div class="bcard b-matrix">
      <div class="bcard-label">DP Matrix</div>
      <div class="matrix-scroll-wrap" id="mScrollWrap">
        <div class="matrix-wrapper" id="mWrapper">
          <div id="matrix-capture">
            <div class="mc-stats" id="mc-stats" style="display:none"></div>
            <table class="matrix" id="mt" role="grid" aria-label="Dynamic programming matrix"></table>
          </div>
        </div>
      </div>
      <div class="dl-row">
        <button class="btn btn-img" onclick="dlMatrixImg()" aria-label="Download matrix sebagai PNG">📷 Download Matrix (PNG)</button>
        <button class="btn btn-xls" onclick="dlMatrixExcel()" aria-label="Download matrix sebagai Excel">📊 Download Matrix (Excel)</button>
      </div>
    </div>

    <!-- EXPLAIN -->
    <div class="bcard b-explain" id="ep">
      <div class="bcard-label">Penjelasan Sel</div>
      <h3>Cara Membaca Setiap Sel</h3>
      <p style="font-size:0.8rem;color:var(--sub);line-height:1.6">Setiap sel berisi 4 nilai: <span style="color:var(--green)">↖ Diagonal</span> | <span style="color:var(--red)">↑ Atas</span> | <span style="color:var(--yellow)">← Kiri</span> | <span style="color:var(--blue)">★ MAX</span></p>
      <div class="calc">
        <div>↖ = sel diagonal + match/mismatch</div>
        <div>↑ = sel atas + gap (${GAP})</div>
        <div>← = sel kiri + gap (${GAP})</div>
        <div>★ = MAX dari ketiganya</div>
      </div>
    </div>

    <!-- RESULT -->
    <div class="bcard b-result" id="rp"></div>`;
  buildTable();
}

function buildTable() {
  const frag = document.createDocumentFragment();
  const tbl = $("mt");
  tbl.innerHTML = "";
  const hr = document.createElement("tr");
  hr.innerHTML = `<th class="corner"></th><th>-</th>${seqH.map((c) => `<th>${escapeHTML(c)}</th>`).join("")}`;
  frag.appendChild(hr);
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<th>${i === 0 ? "-" : escapeHTML(seqV[i - 1])}</th>`;
    for (let j = 0; j < cols; j++) {
      const td = document.createElement("td");
      td.id = `c${i}-${j}`;
      if (i === 0 || j === 0) {
        td.className = "init-cell";
        td.innerHTML = `<span>${matrix[i][j].m}</span><div class="tb-ring"></div>`;
      } else {
        td.className = "cell-4";
        td.innerHTML = `<div class="inner"><div class="dg" id="d${i}-${j}"></div><div class="tp" id="t${i}-${j}"></div><div class="lt" id="l${i}-${j}"></div><div class="mx" id="m${i}-${j}"></div></div><div class="tb-ring"></div>`;
      }
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  tbl.appendChild(frag);
  requestAnimationFrame(() => {
    const sw = $("mScrollWrap");
    if (!sw) return;
    const check = () => {
      sw.classList.toggle(
        "no-fade",
        sw.scrollLeft + sw.clientWidth >= sw.scrollWidth - 4,
      );
    };
    sw.addEventListener("scroll", check, { passive: true });
    check();
  });
}

function epDefault() {
  $("ep").innerHTML = `
    <div class="bcard-label">Penjelasan Sel</div>
    <h3>Cara Membaca Setiap Sel</h3>
    <p style="font-size:0.85rem;color:var(--sub);line-height:1.6">Setiap sel berisi 4 nilai:
      <span style="color:var(--green)">↖ Diagonal</span> |
      <span style="color:var(--red)">↑ Atas</span> |
      <span style="color:var(--yellow)">← Kiri</span> |
      <span style="color:var(--blue)">★ MAX</span></p>
    <div class="calc">
      <div>↖ = sel diagonal + match/mismatch</div>
      <div>↑  = sel atas + gap (${GAP})</div>
      <div>← = sel kiri + gap (${GAP})</div>
      <div>★ = MAX dari ketiganya</div>
    </div>`;
}
function epStep(s) {
  const isMatch = s.s === MATCH,
    mc = isMatch ? "var(--green)" : "var(--yellow)";
  $("ep").innerHTML = `
    <div class="bcard-label">Penjelasan Sel</div>
    <h3>Sel (${escapeHTML(s.cv)}, ${escapeHTML(s.ch)}) — Baris ${s.i}, Kolom ${s.j}</h3>
    <p style="font-size:0.85rem;margin-bottom:6px"><span style="color:${mc}">${escapeHTML(s.cv)} vs ${escapeHTML(s.ch)} = ${isMatch ? "Match ✓" : "Mismatch ✗"} (${sign(s.s)})</span></p>
    <div class="calc">
      <div><span style="color:var(--green)">↖ Diagonal:</span> ${matrix[s.i - 1][s.j - 1].m} + (${sign(s.s)}) = <b>${s.d}</b></div>
      <div><span style="color:var(--red)">↑ Atas &nbsp;&nbsp;:</span> ${matrix[s.i - 1][s.j].m} + (${GAP}) = <b>${s.t}</b></div>
      <div><span style="color:var(--yellow)">← Kiri &nbsp;&nbsp;:</span> ${matrix[s.i][s.j - 1].m} + (${GAP}) = <b>${s.l}</b></div>
      <div style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px">
        <span style="color:var(--blue)">★ MAX(${s.d}, ${s.t}, ${s.l}) = <b>${s.mx}</b></span>
      </div>
    </div>`;
}

// Optimized: track previously highlighted elements instead of querySelectorAll
let _prevHighlighted = [];

function highlightStep(s) {
  // O(1) cleanup instead of O(n) querySelectorAll
  for (const el of _prevHighlighted) {
    el.classList.remove("active", "src");
  }
  _prevHighlighted = [];

  const active = $(`c${s.i}-${s.j}`);
  const src1 = $(`c${s.i - 1}-${s.j - 1}`);
  const src2 = $(`c${s.i - 1}-${s.j}`);
  const src3 = $(`c${s.i}-${s.j - 1}`);

  if (active) {
    active.classList.add("active");
    _prevHighlighted.push(active);
  }
  if (src1) {
    src1.classList.add("src");
    _prevHighlighted.push(src1);
  }
  if (src2) {
    src2.classList.add("src");
    _prevHighlighted.push(src2);
  }
  if (src3) {
    src3.classList.add("src");
    _prevHighlighted.push(src3);
  }
}

function fillCell(s) {
  $(`d${s.i}-${s.j}`).textContent = s.d;
  $(`t${s.i}-${s.j}`).textContent = s.t;
  $(`l${s.i}-${s.j}`).textContent = s.l;
  $(`m${s.i}-${s.j}`).textContent = s.mx;
}
function clearCell(s) {
  $(`d${s.i}-${s.j}`).textContent = "";
  $(`t${s.i}-${s.j}`).textContent = "";
  $(`l${s.i}-${s.j}`).textContent = "";
  $(`m${s.i}-${s.j}`).textContent = "";
}
function setProgress(n, total) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  $("prog").style.width = pct + "%";
  $("si").textContent =
    n === 0 ? 'Klik "Langkah ▶" untuk mulai' : `Langkah ${n} dari ${total} sel`;
}

function updateNavBtns() {
  const btnPrev = $("btnPrev");
  if (!btnPrev) return;
  btnPrev.disabled = cur <= 0;
  const done = cur >= steps.length;
  $("btnStep").disabled = done;
  $("btnFill").disabled = done;
}

function doStep() {
  if (cur >= steps.length) return;
  const s = steps[cur];
  fillCell(s);
  highlightStep(s);
  epStep(s);
  cur++;
  setProgress(cur, steps.length);
  if (cur === steps.length) {
    $("fs").textContent = s.mx;
    showToast(
      "✅ Semua sel terisi! Klik Traceback untuk melihat jalur optimal.",
    );
  }
  updateNavBtns();
}

function doPrev() {
  if (cur <= 0) {
    showToast("ℹ️ Sudah di langkah pertama");
    return;
  }
  cur--;
  const s = steps[cur];
  clearCell(s);
  // Clear all highlights and traced
  for (const el of _prevHighlighted) el.classList.remove("active", "src");
  _prevHighlighted = [];
  document
    .querySelectorAll(".traced")
    .forEach((e) => e.classList.remove("traced"));
  $("rp").classList.remove("visible");
  $("fs").textContent = "—";
  if (cur === 0) {
    setProgress(0, steps.length);
    epDefault();
  } else {
    const prev = steps[cur - 1];
    highlightStep(prev);
    epStep(prev);
    setProgress(cur, steps.length);
  }
  updateNavBtns();
}

function doFillBtn() {
  doFill(false);
}

// Prevent multiple RAF queuing
let _fillRAF = null;

function doFill(silent) {
  if (typeof silent !== "boolean") silent = false;
  if (cur >= steps.length) {
    if (!silent) showToast("Matriks sudah penuh. Klik Traceback 🔍");
    return;
  }
  const btn = $("btnFill");
  btn.classList.add("loading");
  btn.textContent = "Mengisi...";

  if (_fillRAF) cancelAnimationFrame(_fillRAF);
  _fillRAF = requestAnimationFrame(() => {
    _fillRAF = requestAnimationFrame(() => {
      while (cur < steps.length) {
        const s = steps[cur];
        fillCell(s);
        cur++;
      }
      const last = steps[steps.length - 1];
      highlightStep(last);
      epStep(last);
      setProgress(cur, steps.length);
      $("fs").textContent = last.mx;
      btn.classList.remove("loading");
      btn.textContent = "Isi Semua ⏩";
      updateNavBtns();
      if (!silent)
        showToast(
          "✅ Semua sel terisi! Klik Traceback untuk melihat jalur optimal.",
        );
      _fillRAF = null;
    });
  });
}

function doReset() {
  if (cur === 0) {
    showToast("ℹ️ Matriks sudah kosong");
    return;
  }
  openModal();
}
function _doReset() {
  cur = 0;
  // Clear tracked highlights
  for (const el of _prevHighlighted) el.classList.remove("active", "src");
  _prevHighlighted = [];
  document
    .querySelectorAll(".traced")
    .forEach((e) => e.classList.remove("traced"));
  $("fs").textContent = "—";
  setProgress(0, steps.length);
  $("rp").classList.remove("visible");
  const mcs = $("mc-stats");
  if (mcs) {
    mcs.style.display = "none";
    mcs.innerHTML = "";
  }
  for (const s of steps) clearCell(s);
  epDefault();
  showToast("↺ Matriks direset");
  updateNavBtns();
}

let _traceRAF = null;

function doTrace() {
  if (cur < steps.length) {
    const btn = $("btnFill");
    btn.classList.add("loading");
    btn.textContent = "Mengisi...";
    if (_traceRAF) cancelAnimationFrame(_traceRAF);
    _traceRAF = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        while (cur < steps.length) {
          const s = steps[cur];
          fillCell(s);
          cur++;
        }
        btn.classList.remove("loading");
        btn.textContent = "Isi Semua ⏩";
        $("fs").textContent = steps[steps.length - 1].mx;
        setProgress(cur, steps.length);
        updateNavBtns();
        _runTrace();
        _traceRAF = null;
      }),
    );
  } else {
    _runTrace();
  }
}

function _runTrace() {
  // Clear previous highlights using tracked references
  for (const el of _prevHighlighted) el.classList.remove("active", "src");
  _prevHighlighted = [];

  for (const [i, j] of tbPath) $(`c${i}-${j}`).classList.add("traced");
  const aH = [],
    aV = [],
    mk = [];
  let ti = rows - 1,
    tj = cols - 1;
  while (ti > 0 || tj > 0) {
    if (ti > 0 && tj > 0 && matrix[ti][tj].m === matrix[ti][tj].d) {
      aH.unshift(seqH[tj - 1]);
      aV.unshift(seqV[ti - 1]);
      mk.unshift(seqH[tj - 1] === seqV[ti - 1] ? "|" : ".");
      ti--;
      tj--;
    } else if (ti > 0 && (tj === 0 || matrix[ti][tj].m === matrix[ti][tj].t)) {
      aH.unshift("-");
      aV.unshift(seqV[ti - 1]);
      mk.unshift(" ");
      ti--;
    } else if (tj > 0) {
      aH.unshift(seqH[tj - 1]);
      aV.unshift("-");
      mk.unshift(" ");
      tj--;
    } else {
      break;
    }
  }
  const mCnt = mk.filter((x) => x === "|").length,
    miCnt = mk.filter((x) => x === ".").length,
    gCnt = mk.filter((x) => x === " ").length;
  const score = matrix[rows - 1][cols - 1].m;

  const charsA = aH
    .map(
      (c, k) =>
        `<span class="${mk[k] === "|" ? "mc" : mk[k] === "." ? "mmc" : ""}">${escapeHTML(c)}</span>`,
    )
    .join("");
  const charsMid = mk
    .map(
      (c, k) =>
        `<span class="${c === "|" ? "mc" : c === "." ? "mmc" : ""}">${c === "|" ? "|" : c === "." ? "·" : "&nbsp;"}</span>`,
    )
    .join("");
  const charsB = aV
    .map(
      (c, k) =>
        `<span class="${mk[k] === "|" ? "mc" : mk[k] === "." ? "mmc" : ""}">${escapeHTML(c)}</span>`,
    )
    .join("");

  const mcStats = $("mc-stats");
  mcStats.style.display = "flex";
  mcStats.innerHTML = `
    <span class="s-match">Match: ${mCnt}</span>
    <span class="s-mis">Mismatch: ${miCnt}</span>
    <span class="s-gap">Gap: ${gCnt}</span>
    <span class="s-score">Skor: ${score}</span>`;

  const rp = $("rp");
  rp.classList.add("visible");
  rp.innerHTML = `<div class="bcard-label">Hasil Alignment</div><h3>Hasil Alignment Optimal</h3>
    <div style="display:flex;justify-content:center">
      <div class="align-block">
        <div class="align-row"><span class="align-lbl">A:</span><div class="align-chars">${charsA}</div></div>
        <div class="align-row"><span class="align-lbl"></span><div class="align-chars">${charsMid}</div></div>
        <div class="align-row"><span class="align-lbl">B:</span><div class="align-chars">${charsB}</div></div>
      </div>
    </div>
    <div class="dl-row">
      <button class="btn btn-img" onclick="dlResultImg()">📷 Download Hasil (PNG)</button>
    </div>`;
  $("ep").innerHTML =
    `<div class="bcard-label">Penjelasan Sel</div><h3>Traceback Path</h3><p style="font-size:0.8rem;color:var(--sub);line-height:1.6">Jalur <span style="color:#22c55e;font-weight:700">hijau</span> = traceback dari pojok kanan bawah → kiri atas.<br>Diagonal = match/mismatch &nbsp;|&nbsp; Atas = gap di A &nbsp;|&nbsp; Kiri = gap di B</p>`;
  showToast("🔍 Traceback selesai! Lihat hasil alignment di bawah.");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Lazy load html2canvas — only when needed (not render-blocking)
let _html2canvasPromise = null;

function loadHtml2Canvas() {
  if (!_html2canvasPromise) {
    _html2canvasPromise = new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.crossOrigin = "anonymous";
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => {
        _html2canvasPromise = null;
        reject(new Error("Failed to load html2canvas"));
      };
      document.head.appendChild(s);
    });
  }
  return _html2canvasPromise;
}

async function capture(el, bg) {
  const h2c = await loadHtml2Canvas();
  return h2c(el, {
    backgroundColor: bg,
    scale: 2,
    useCORS: true,
    logging: false,
  });
}

function triggerDl(canvas, name) {
  const a = document.createElement("a");
  a.download = name;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

async function dlMatrixImg() {
  if (cur < steps.length) {
    while (cur < steps.length) {
      fillCell(steps[cur]);
      cur++;
    }
    const last = steps[steps.length - 1];
    highlightStep(last);
    epStep(last);
    setProgress(cur, steps.length);
    $("fs").textContent = last.mx;
    updateNavBtns();
  }
  await new Promise((r) => requestAnimationFrame(r));
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  try {
    triggerDl(
      await capture($("matrix-capture"), isLight ? "#ffffff" : "#161f30"),
      "dp_matrix.png",
    );
  } catch (e) {
    showToast("⚠️ Gagal memuat library screenshot. Coba lagi.");
  }
}

async function dlResultImg() {
  const el = $("rp");
  const clone = el.cloneNode(true);
  const dlr = clone.querySelector(".dl-row");
  if (dlr) dlr.remove();
  Object.assign(clone.style, {
    position: "fixed",
    top: "-9999px",
    left: "-9999px",
    width: el.offsetWidth + "px",
  });
  document.body.appendChild(clone);
  await new Promise((r) => requestAnimationFrame(r));
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  try {
    triggerDl(
      await capture(clone, isLight ? "#ffffff" : "#161f30"),
      "alignment_result.png",
    );
  } catch (e) {
    showToast("⚠️ Gagal memuat library screenshot. Coba lagi.");
  }
  document.body.removeChild(clone);
}

function colLetter(i) {
  let s = "";
  i++;
  while (i > 0) {
    s = String.fromCharCode(64 + (i % 26 || 26)) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

function buildStyledXLSX(sheetName, cells, merges, colWidths) {
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const pns = "http://schemas.openxmlformats.org/package/2006/relationships";
  const rns =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

  const ss = [],
    ssMap = {};
  const si = (v) => {
    const k = String(v);
    if (!(k in ssMap)) {
      ssMap[k] = ss.length;
      ss.push(k);
    }
    return ssMap[k];
  };

  const rowMap = {};
  for (const { r, c, v, s } of cells) {
    if (!rowMap[r]) rowMap[r] = [];
    rowMap[r].push({ c, v, s });
  }
  let rowsXml = "";
  for (const r of Object.keys(rowMap)
    .map(Number)
    .sort((a, b) => a - b)) {
    let cellsXml = "";
    for (const { c, v, s } of rowMap[r].sort((a, b) => a.c - b.c)) {
      const ref = `${colLetter(c - 1)}${r}`;
      const sAttr = s !== undefined ? ` s="${s}"` : "";
      if (typeof v === "number")
        cellsXml += `<c r="${ref}"${sAttr}><v>${v}</v></c>`;
      else if (v !== null && v !== undefined && v !== "")
        cellsXml += `<c r="${ref}" t="s"${sAttr}><v>${si(v)}</v></c>`;
      else if (s !== undefined) cellsXml += `<c r="${ref}"${sAttr}/>`;
    }
    if (cellsXml) rowsXml += `<row r="${r}">${cellsXml}</row>`;
  }

  let colsXml = "";
  if (colWidths && colWidths.length) {
    colsXml =
      "<cols>" +
      colWidths
        .map(
          ({ col, width }) =>
            `<col min="${col}" max="${col}" width="${width}" customWidth="1"/>`,
        )
        .join("") +
      "</cols>";
  }

  let mergeXml = "";
  if (merges && merges.length) {
    mergeXml = `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>`;
  }

  const noBorder = `<border><left/><right/><top/><bottom/><diagonal/></border>`;
  const thinBorder = `<border><left style="thin"><color rgb="FF475569"/></left><right style="thin"><color rgb="FF475569"/></right><top style="thin"><color rgb="FF475569"/></top><bottom style="thin"><color rgb="FF475569"/></bottom><diagonal/></border>`;
  const medBorder = `<border><left style="medium"><color rgb="FF64748B"/></left><right style="medium"><color rgb="FF64748B"/></right><top style="medium"><color rgb="FF64748B"/></top><bottom style="medium"><color rgb="FF64748B"/></bottom><diagonal/></border>`;
  const tbBorder = `<border><left style="thick"><color rgb="FF22C55E"/></left><right style="thick"><color rgb="FF22C55E"/></right><top style="thick"><color rgb="FF22C55E"/></top><bottom style="thick"><color rgb="FF22C55E"/></bottom><diagonal/></border>`;
  const hdrBotBorder = `<border><left style="thin"><color rgb="FF475569"/></left><right style="thin"><color rgb="FF475569"/></right><top style="medium"><color rgb="FF64748B"/></top><bottom style="medium"><color rgb="FF94A3B8"/></bottom><diagonal/></border>`;
  const titleBorder = `<border><left/><right/><top/><bottom style="medium"><color rgb="FF3B82F6"/></bottom><diagonal/></border>`;
  const infoBorder = `<border><left/><right/><top/><bottom style="thin"><color rgb="FF334155"/></bottom><diagonal/></border>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${ns}">
<fonts count="10">
  <font><sz val="11"/><color rgb="FFCBD5E1"/><name val="Calibri"/></font>
  <font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  <font><sz val="10"/><color rgb="FF4ADE80"/><name val="Calibri"/></font>
  <font><sz val="10"/><color rgb="FFFF6B6B"/><name val="Calibri"/></font>
  <font><sz val="10"/><color rgb="FFFBBF24"/><name val="Calibri"/></font>
  <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  <font><b/><sz val="12"/><color rgb="FF4ADE80"/><name val="Calibri"/></font>
  <font><sz val="10"/><color rgb="FF94A3B8"/><name val="Calibri"/></font>
  <font><b/><sz val="10"/><color rgb="FF67E8F9"/><name val="Calibri"/></font>
</fonts>
<fills count="8">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF052E16"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF334155"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF0C4A6E"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF162032"/></patternFill></fill>
</fills>
<borders count="7">${noBorder}${thinBorder}${medBorder}${tbBorder}${hdrBotBorder}${titleBorder}${infoBorder}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12">
  <xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0"/>
  <xf numFmtId="0" fontId="1" fillId="2" borderId="5" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="2" fillId="5" borderId="4" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="9" fillId="6" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="6" fillId="3" borderId="2" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="7" fillId="4" borderId="3" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="8" fillId="7" borderId="6" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
</cellXfs>
</styleSheet>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${ns}"><sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A5" sqref="A5"/></sheetView></sheetViews>${colsXml}<sheetData>${rowsXml}</sheetData>${mergeXml}</worksheet>`;
  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${ns}" xmlns:r="${rns}"><sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  return makeZip({
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${pns}"><Relationship Id="rId1" Type="${rns}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": wbXml,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${pns}"><Relationship Id="rId1" Type="${rns}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rns}/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="rId3" Type="${rns}/styles" Target="styles.xml"/></Relationships>`,
    "xl/worksheets/sheet1.xml": sheetXml,
    "xl/sharedStrings.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="${ns}" count="${ss.length}" uniqueCount="${ss.length}">${ss.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join("")}</sst>`,
    "xl/styles.xml": stylesXml,
  });
}

function makeZip(files) {
  const enc = new TextEncoder();
  const crc32 = (d) => {
    let c = 0xffffffff;
    const t = new Uint8Array(256).map((_, i) => {
      let v = i;
      for (let j = 0; j < 8; j++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
      return v;
    });
    for (const b of d) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const u32 = (n) => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, true);
    return b;
  };
  const u16 = (n) => {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, true);
    return b;
  };
  const parts = [],
    central = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nb = enc.encode(name),
      db = enc.encode(content),
      crc = crc32(db);
    const lh = new Uint8Array([
      0x50,
      0x4b,
      0x03,
      0x04,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      ...u32(crc),
      ...u32(db.length),
      ...u32(db.length),
      ...u16(nb.length),
      0,
      0,
      ...nb,
    ]);
    const eo = offset;
    parts.push(lh, db);
    offset += lh.length + db.length;
    central.push(
      new Uint8Array([
        0x50,
        0x4b,
        0x01,
        0x02,
        20,
        0,
        20,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...u32(crc),
        ...u32(db.length),
        ...u32(db.length),
        ...u16(nb.length),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...u32(eo),
        ...nb,
      ]),
    );
  }
  const cd = join(central);
  return join([
    ...parts,
    cd,
    new Uint8Array([
      0x50,
      0x4b,
      0x05,
      0x06,
      0,
      0,
      0,
      0,
      ...u16(central.length),
      ...u16(central.length),
      ...u32(cd.length),
      ...u32(offset),
      0,
      0,
    ]),
  ]);
}

function join(arr) {
  const out = new Uint8Array(arr.reduce((s, a) => s + a.length, 0));
  let p = 0;
  for (const a of arr) {
    out.set(a, p);
    p += a.length;
  }
  return out;
}

function saveBlob(bytes, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([bytes], { type: "application/octet-stream" }),
  );
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function dlMatrixExcel() {
  if (!matrix) return;
  const tbSet = new Set(tbPath.map(([i, j]) => `${i},${j}`));
  const S = {
    TITLE: 1,
    HDR: 2,
    INIT: 3,
    DIAG: 4,
    LEFT: 5,
    UP: 6,
    VAL: 7,
    TBVAL: 8,
  };

  const R_TITLE = 1;
  const R_INFO1 = 2;
  const R_INFO2 = 3;
  const R_HDR = 4;
  const R_DATA = 5;

  const col = (j) => 2 + j * 2;
  const row = (i) => R_DATA + i * 2;

  const totalCol = col(cols - 1) + 1;

  const CL = (c) => colLetter(c - 1);

  const xcells = [];
  const merges = [];
  const add = (r, c, v, s) => xcells.push({ r, c, v, s });
  const merge = (r1, c1, r2, c2) =>
    merges.push(`${CL(c1)}${r1}:${CL(c2)}${r2}`);

  add(R_TITLE, 1, "DP Matrix — Needleman-Wunsch", S.TITLE);
  merge(R_TITLE, 1, R_TITLE, totalCol);

  add(R_INFO1, 1, `SeqA (horizontal →): ${seqH.join(" ")}`, 9);
  merge(R_INFO1, 1, R_INFO1, totalCol);

  add(
    R_INFO2,
    1,
    `SeqB (vertikal ↓): ${seqV.join(" ")}     Match: ${MATCH}   Mismatch: ${MIS}   Gap: ${GAP}     ↖=Diagonal  ←=Kiri  ↑=Atas  ★=MAX  (*=traceback)`,
    9,
  );
  merge(R_INFO2, 1, R_INFO2, totalCol);

  add(R_HDR, 1, "", S.HDR);

  for (let j = 0; j < cols; j++) {
    const c1 = col(j);
    const c2 = c1 + 1;
    add(R_HDR, c1, j === 0 ? "-" : seqH[j - 1], S.HDR);
    merge(R_HDR, c1, R_HDR, c2);
  }

  for (let i = 0; i < rows; i++) {
    const r1 = row(i);
    const r2 = r1 + 1;

    add(r1, 1, i === 0 ? "-" : seqV[i - 1], S.HDR);
    merge(r1, 1, r2, 1);

    for (let j = 0; j < cols; j++) {
      const c1 = col(j);
      const c2 = c1 + 1;
      const inTb = tbSet.has(`${i},${j}`);

      if (i === 0 || j === 0) {
        add(r1, c1, matrix[i][j].m, S.INIT);
        merge(r1, c1, r2, c2);
      } else {
        const { d, t, l, m } = matrix[i][j];
        add(r1, c1, d, S.DIAG);
        add(r1, c2, l, S.LEFT);
        add(r2, c1, t, S.UP);
        add(r2, c2, m, inTb ? S.TBVAL : S.VAL);
      }
    }
  }

  const colWidths = [{ col: 1, width: 5 }];
  for (let c = 2; c <= totalCol; c++) colWidths.push({ col: c, width: 6 });

  saveBlob(
    buildStyledXLSX("DP Matrix", xcells, merges, colWidths),
    "dp_matrix.xlsx",
  );
}
