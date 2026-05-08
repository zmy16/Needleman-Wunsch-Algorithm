# 🧬 DNA Sequence Alignment — Needleman-Wunsch

Visualisasi interaktif algoritma **Needleman-Wunsch** untuk *sequence alignment* DNA. Aplikasi web ini menampilkan langkah-demi-langkah pengisian DP (Dynamic Programming) matrix dan proses traceback secara visual.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## 📖 Tentang Proyek

Proyek ini merupakan implementasi visual dari algoritma Needleman-Wunsch yang digunakan dalam bioinformatika untuk melakukan *global sequence alignment* pada sekuens DNA. Aplikasi ini dirancang untuk tujuan edukasi agar pengguna dapat memahami cara kerja algoritma secara interaktif.

## ✨ Fitur

- **Visualisasi Langkah-demi-Langkah** — Lihat bagaimana setiap sel pada DP matrix dihitung satu per satu
- **Traceback Path** — Tampilkan jalur optimal dari pojok kanan bawah ke kiri atas
- **Preset Sekuens** — Beberapa contoh sekuens DNA siap pakai (Kelompok 4, Simple, Contoh Gap, Panjang)
- **Konfigurasi Skor** — Atur nilai match, mismatch, dan gap penalty sesuai kebutuhan
- **Penjelasan Sel** — Setiap langkah disertai penjelasan detail perhitungan (diagonal, atas, kiri, MAX)
- **Dark/Light Mode** — Tema gelap dan terang dengan transisi halus
- **Download Matrix (PNG)** — Simpan matriks sebagai gambar PNG
- **Download Matrix (Excel)** — Ekspor matriks ke format Excel (.xlsx) dengan styling
- **Responsive Design** — Tampilan optimal di desktop maupun mobile
- **Validasi Input** — Hanya menerima karakter DNA valid (A, C, G, T, N) dengan maksimal 15 karakter

## 🚀 Cara Menggunakan

1. **Buka** file `index.html` di browser
2. **Masukkan** sekuens DNA pada kolom Sekuens A dan Sekuens B, atau pilih salah satu **preset**
3. **Atur** nilai skor Match, Mismatch, dan Gap (opsional)
4. Klik **"Generate ▶"** untuk membuat matriks
5. Gunakan tombol kontrol:
   - **Langkah ▶** — Isi sel satu per satu
   - **◀ Mundur** — Kembali ke langkah sebelumnya
   - **Isi Semua ⏩** — Isi seluruh matriks sekaligus
   - **Traceback 🔍** — Tampilkan jalur alignment optimal
   - **↺ Reset** — Kosongkan matriks

## 🧪 Contoh Preset

| Preset | Sekuens A | Sekuens B | Match | Mismatch | Gap |
|--------|-----------|-----------|-------|----------|-----|
| Kelompok 4 | CTACGCATC | CAAGCCTAC | +2 | +1 | -1 |
| Simple | ACGT | AGT | +2 | -1 | -2 |
| Contoh Gap | AGTACG | ACATAG | +2 | +1 | -1 |
| Panjang | ATCGATCGATCG | ATGCATGCATGC | +1 | -1 | -2 |

## 📂 Struktur Proyek

```
web-alignment/
├── index.html          # Halaman utama
├── assets/
│   ├── script.js       # Logika algoritma & interaksi UI
│   └── style.css       # Styling (dark/light theme)
└── README.md           # Dokumentasi proyek
```

## 🔬 Tentang Algoritma Needleman-Wunsch

Algoritma Needleman-Wunsch adalah metode *global alignment* yang menggunakan pendekatan **dynamic programming** untuk menemukan alignment optimal antara dua sekuens. Langkah-langkahnya:

1. **Inisialisasi** — Baris pertama dan kolom pertama diisi dengan kelipatan gap penalty
2. **Pengisian Matrix** — Setiap sel dihitung berdasarkan:
   - ↖ **Diagonal**: skor sel diagonal + match/mismatch
   - ↑ **Atas**: skor sel atas + gap penalty
   - ← **Kiri**: skor sel kiri + gap penalty
   - ★ **MAX**: nilai maksimum dari ketiganya
3. **Traceback** — Menelusuri jalur dari sel kanan bawah ke kiri atas untuk mendapatkan alignment optimal

## 🛠️ Teknologi

- **HTML5** — Struktur halaman
- **CSS3** — Styling dengan CSS Variables, Grid Layout, dan tema responsif
- **Vanilla JavaScript** — Logika algoritma tanpa framework/library tambahan
- **html2canvas** — Library untuk screenshot matrix (lazy-loaded)

## 🌐 Browser Support

Aplikasi ini mendukung browser modern:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

## 📄 Lisensi

Proyek ini dibuat untuk keperluan edukasi.

---

<p align="center">
  Dibuat dengan ❤️ untuk pembelajaran Bioinformatika
</p>
