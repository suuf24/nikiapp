# Niki

Pembuat naskah soal ujian berukuran A4. Seluruh aplikasi ada di dalam satu berkas `index.html`: CSS dan JavaScript inline, tanpa langkah build, tanpa `package.json`, tanpa dependensi. Semua data diproses di peramban, tidak ada yang dikirim ke server.

Tiga panel membentuk alurnya: **Identitas Dokumen**, **Masukkan Soal**, dan **Preview Dokumen**.

## Menjalankan

Buka `index.html` di peramban (klik dua kali, atau seret berkasnya ke jendela peramban). Tidak ada yang perlu dipasang.

Ingin disajikan lewat server lokal? Dari folder ini:

```
python -m http.server 8000
```

lalu buka `http://localhost:8000/index.html`.

## Alur pemakaian

1. **Identitas.** Isi judul ujian, nama sekolah, dan identitas peserta untuk kop halaman pertama, lalu atur jenis huruf, ukuran huruf, gaya kop, dan margin.
2. **Soal.** Pilih salah satu sumber: muat berkas TXT, ketik langsung di panel **Ketik manual** memakai penanda `[SECTION]` dan `[QUESTION]` (contoh formatnya tersedia lewat **Unduh Template**), atau salin **Prompt AI** lalu kerjakan di ChatGPT atau Google AI Studio dan tempel hasilnya di panel ketik manual. Gambar disisipkan lewat penanda `[GAMBAR: nama-gambar]` setelah gambarnya ditambahkan pada panel **Gambar soal**.
3. **Preview.** Periksa halaman A4 dan sesuaikan zoom. Bila ada soal yang perlu digeser, diganti lebarnya, atau dimulai di halaman baru, pakai mode **Edit naskah** lalu tombol **+ / − 1 baris**, **Setel lebar**, dan **Mulai halaman baru**.
4. **Cetak / PDF.** Membuka dialog cetak peramban. Pilih "Simpan sebagai PDF" untuk menyimpan berkas digital. `Ctrl` + `P` melakukan hal yang sama.

## Berkas

| Berkas | Isi |
|---|---|
| `index.html` | seluruh aplikasi: markup, gaya, dan skrip |
| `Design.md` | sistem desain: prinsip, token warna, tipografi, komponen |
| `icon.png` | gambar sumber ikon aplikasi |
| `tools/m3-palette.mjs` | menghasilkan blok token warna Material 3 dan menyisipkannya ke `index.html` |
| `tools/app-icon.mjs` | menyiapkan blok ikon di `index.html` dari `icon.png` |
| `tools/typecheck.mjs` | memeriksa tipe skrip inline di `index.html` |
| `tools/rellenar-pdf.mjs` | melengkapi output cetak sebagaii PDF agar setiap halaman terisi penuh, lewat CSS print + pemicu PrintTimeline (dipakai saat simpan PDF atau cetak) |
| `AGENTS.md` | penunjuk skill antislop untuk agen |

## Pemeriksaan

```
node tools/typecheck.mjs
```

Skrip menyalin skrip inline ke berkas sementara di luar proyek, menjalankannya lewat `tsc` (`npx -y -p typescript@5`), dan tidak pernah mengubah `index.html`. Kode keluar: `0` bersih, `1` ada galat tipe, `2` ekstraksi gagal.

```
node tools/app-icon.mjs --check
```

Memeriksa apakah blok ikon di `index.html` masih cocok dengan `icon.png`.

## Tema

Terang, gelap, atau mengikuti sistem, dengan tombol di bilah atas. Warna strukturnya putih, abu, dan hitam, dengan kuning sebagai satu aksen. Kubah gigi/tombol, bilah gunting, dan tepi formulir ada di katalog tombol aktif/tidak aktif/sirkuit dan aturannya sendiri di `index.html`. Huruf Inter dimuat dari Google Fonts hanya bila perangkat daring; saat luring, tumpukan huruf sistem yang dipakai sehingga tampilan tetap utuh. Rincian palet dan aturannya ada di [Design.md](Design.md).
