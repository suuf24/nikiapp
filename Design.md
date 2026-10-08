# Design.md — Dashboard Design System

Design system yang diekstrak dari 5 gambar referensi ("Dashboard Overview": light, clean, bento-grid, aksen kuning, tombol hitam, sentuhan glassmorphism). Dokumen ini dibuat agar bisa dipakai ulang di project apa pun (web app, admin panel, SaaS, mobile web).

> **Catatan sumber nilai**
> - **Pasti** (tertulis di gambar 4): 4 warna utama dan font **Inter**.
> - **Estimasi** (diukur visual dari screenshot): radius, spacing, ukuran font, warna sekunder (hijau/merah/biru gradient). Sesuaikan dengan kebutuhan project.

---

## 1. Design Principles

1. **Calm & airy** — banyak ruang putih, kartu putih di atas kanvas abu sangat muda.
2. **Monokrom + satu aksen** — hitam/putih/abu untuk struktur, **kuning** hanya untuk highlight data dan status penting.
3. **Soft & rounded** — semua elemen berbentuk pill atau kartu dengan radius besar. Hampir tidak ada garis border tegas.
4. **Hierarki lewat ukuran & bobot**, bukan warna. Angka penting besar, label kecil abu.
5. **Satu CTA utama per area** — tombol hitam pekat (solid) menandai aksi utama; aksi sekunder pakai abu.
6. **Glass hanya untuk momen spesial** (promo/upgrade), bukan untuk semua kartu.

---

## 2. Design Tokens

### 2.1 Color

| Token | Nama | Hex | RGB | Penggunaan |
|---|---|---|---|---|
| `--color-white` | White | `#FFFFFF` | 255 255 255 | Surface kartu, shell luar |
| `--color-grey-100` | Light Grey | `#E9E9E9` | 233 233 233 | Search bar, tombol sekunder, track progress, icon button nonaktif |
| `--color-yellow-500` | Yellow | `#FFCB5B` | 255 203 91 | Aksen utama: badge, tooltip, bar highlight, titik status |
| `--color-black` | Black | `#101010` | 16 16 16 | Tombol primer, nav aktif, teks utama |

**Warna turunan (estimasi):**

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-canvas` | `#EDEDED` | Background halaman di luar shell |
| `--color-surface-app` | `#F4F4F4` | Background area dalam aplikasi (di belakang kartu) |
| `--color-text-primary` | `#101010` | Judul, angka |
| `--color-text-secondary` | `#6B6B6B` | Subjudul, label, placeholder |
| `--color-text-muted` | `#9A9A9A` | Label sumbu chart, caption |
| `--color-yellow-600` | `#F5A800` | Gauge/progress aktif (kuning lebih pekat) |
| `--color-yellow-200` | `#FBE4A8` | Gauge/progress bagian "completed"/pudar |
| `--color-success` | `#16A34A` | Indikator tren naik (↗ 12.5%), progress sukses |
| `--color-danger` | `#EF4444` | Progress kritis/rendah |
| `--color-promo-from` | `#DCEBFF` | Gradient promo (atas, biru muda) |
| `--color-promo-to` | `#F9DFA0` | Gradient promo (bawah, peach/kuning) |

### 2.2 Typography — **Inter**

Font: **Inter** (Google Fonts / `@fontsource/inter`). Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.

| Token | Ukuran / Line-height | Weight | Contoh pemakaian |
|---|---|---|---|
| `display` | 48 / 56 | 500 | Countdown "15:25:34" |
| `h1` | 32 / 40 | 500 | "Dashboard Overview" |
| `stat` | 32 / 40 | 500 | "$284.5K" |
| `h3` (card title) | 16 / 24 | 500 | "Revenue Overview", "Team Performance" |
| `body` | 14 / 20 | 400 | Subjudul, teks tombol |
| `label` | 12 / 16 | 400 | "This Month Earning", nama klien |
| `caption` | 11 / 14 | 400 | Label bulan, legenda status |

Aturan: letter-spacing sedikit rapat pada ukuran besar (`-0.02em` untuk h1/display/stat). Angka gunakan `font-variant-numeric: tabular-nums` (terutama countdown & persentase).

### 2.3 Radius

| Token | Nilai | Pemakaian |
|---|---|---|
| `--radius-sm` | 8px | Tile ikon kecil, progress bar |
| `--radius-md` | 16px | Kartu bersarang (Help card), tooltip |
| `--radius-lg` | 24px | Kartu utama |
| `--radius-xl` | 32px | Shell/frame luar |
| `--radius-full` | 9999px | Tombol, chip, search, icon button, avatar |

### 2.4 Spacing (skala 4px)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40`
- Padding kartu: **20px**
- Gap antar kartu: **8–12px** (rapat khas bento)
- Gap antar tombol header: **8px**
- Padding shell luar: **8–12px**

### 2.5 Shadow & Border

- Kartu: **tanpa border**, shadow sangat halus `0 1px 2px rgba(16,16,16,.04)` (opsional).
- Tombol sekunder & elemen glass: shadow tipis `0 2px 6px rgba(16,16,16,.06)`.
- Shell luar: border putih tebal (~8px) + `radius-xl` sebagai "bingkai".
- Tooltip/badge kuning: `0 4px 12px rgba(255,203,91,.35)`.

### 2.6 Iconography

- Gaya: **outline/line icon**, stroke ±1.5px, sudut membulat (mirip Lucide / Phosphor Regular).
- Ukuran: 20px di sidebar, 16px di tombol & list, 14px di icon button kecil.
- Warna: `--color-black` (aktif/di atas abu), putih (di atas hitam).
- Ikon yang dipakai: dashboard-grid, bar-chart, folder, users, money-bag, user-dollar, calendar, settings/hexagon, logout, search, chat, bell, expand/maximize, crown, help-circle, arrow-right, plus, invoice, report, user-plus, close (X).

### 2.7 Kode token siap pakai

```css
:root {
  /* Color */
  --color-white: #FFFFFF;
  --color-grey-100: #E9E9E9;
  --color-yellow-500: #FFCB5B;
  --color-yellow-600: #F5A800;
  --color-yellow-200: #FBE4A8;
  --color-black: #101010;
  --color-canvas: #EDEDED;
  --color-surface-app: #F4F4F4;
  --color-text-primary: #101010;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #9A9A9A;
  --color-success: #16A34A;
  --color-danger: #EF4444;
  --gradient-promo: linear-gradient(180deg, #DCEBFF 0%, #EAF3FF 35%, #F9DFA0 100%);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-full: 9999px;

  /* Spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

  /* Type */
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;

  /* Shadow */
  --shadow-card: 0 1px 2px rgba(16,16,16,.04);
  --shadow-soft: 0 2px 6px rgba(16,16,16,.06);
  --shadow-accent: 0 4px 12px rgba(255,203,91,.35);
}

body {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-app);
}
```

```js
// tailwind.config.js (extend)
export default {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          white: '#FFFFFF',
          grey: '#E9E9E9',
          yellow: '#FFCB5B',
          black: '#101010',
        },
        canvas: '#EDEDED',
        app: '#F4F4F4',
      },
      borderRadius: { sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    },
  },
};
```

---

## 3. Layout

### 3.1 Struktur halaman

```
┌───────────────────────────────────────────────────────────────┐  ← Shell (white frame, radius-xl)
│ [Logo]  [ Search anything here...        ]      (💬)(🔔)(👤)  │  ← Topbar
│                                                               │
│ Dashboard Overview            [Invoice][Report][Client][+New] │  ← Page header + actions
│ Here's what's happening…                                      │
│                                                               │
│ (●) ┌─────────┐ ┌──────────────────┐ ┌────────────┐           │
│ ( ) │ Promo   │ │ Revenue Overview │ │ Project    │           │  ← Bento grid
│ ( ) │ card    │ └──────────────────┘ │ Status     │           │
│ ( ) │ (tall)  │ ┌────────┐┌────────┐ ├────────────┤           │
│ ( ) │         │ │ Team   ││ Active │ │ Next Meet. │           │
│ ( ) │         │ │ Perf.  ││ Proj.  │ ├────────────┤           │
│ (↩) └─────────┘ └────────┘└────────┘ │ Top Clients│           │
│                                      └────────────┘           │
└───────────────────────────────────────────────────────────────┘
```

- **Sidebar**: kolom ikon vertikal ±48px, tombol logout menempel di bawah.
- **Konten**: grid 12 kolom, gap 8–12px.
- Referensi proporsi kolom (desktop ≥1280px): Promo = 3 kol, Revenue = 5 kol, Project Status = 4 kol; Team Perf = 3 kol, Active Projects = 5 kol, Meeting/Top Clients = 4 kol.

### 3.2 Grid CSS contoh

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}
.card-promo    { grid-column: span 3; grid-row: span 2; }
.card-revenue  { grid-column: span 5; }
.card-status   { grid-column: span 4; }
.card-team     { grid-column: span 3; }
.card-projects { grid-column: span 5; }
.card-side     { grid-column: span 4; display: grid; gap: 12px; }
```

### 3.3 Responsive

| Breakpoint | Perilaku |
|---|---|
| ≥1280 | Layout penuh seperti referensi |
| 768–1279 | Grid 6 kolom; promo card jadi horizontal/di-dismiss; sidebar tetap ikon |
| <768 | 1 kolom; sidebar jadi bottom-nav / drawer; tombol aksi header menjadi scroll horizontal atau menu "+"; kartu penuh lebar |

---

## 4. Components

### 4.1 Card (container dasar)

| Properti | Nilai |
|---|---|
| Background | `--color-white` |
| Radius | `--radius-lg` (24px) |
| Padding | 20px |
| Border | none |
| Header | Judul (`h3`) kiri + **Expand icon button** kanan |

```html
<section class="card">
  <header class="card__header">
    <h3>Revenue Overview</h3>
    <button class="icon-btn icon-btn--sm" aria-label="Expand"></button>
  </header>
  <!-- content -->
</section>
```

Varian: **Card** (putih), **Card Promo** (gradient + glass), **Card Nested** (di dalam kartu lain: radius 16px, background translucent putih/kuning).

---

### 4.2 Buttons

| Varian | Background | Teks | Radius | Tinggi | Pemakaian |
|---|---|---|---|---|---|
| **Primary** | `#101010` | putih | full | 40–48px | "New Project", "Upgrade Now →" |
| **Secondary** | `#E9E9E9` | `#101010` | full | 36–40px | "Create Invoice", "Create A Report", "Add Client" |
| **Icon (circle)** | `#E9E9E9` | ikon hitam | full | 32–48px | Chat, notif, expand |
| **Icon Active** | `#101010` | ikon putih | full | 48px | Nav sidebar aktif |

- Tombol berisi **ikon 16px + label**, gap 8px, padding horizontal 16–20px.
- Primary CTA lebar penuh boleh dipakai di dalam kartu promo (dengan ikon panah di kanan).
- State: hover → naik sedikit kecerahan (primary → `#262626`, secondary → `#DEDEDE`); active → `scale(.98)`; focus-visible → ring 2px `--color-yellow-500` offset 2px; disabled → opacity .4.

```css
.btn { display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 18px;
       border-radius:var(--radius-full); font:500 14px/1 var(--font-sans); border:0; cursor:pointer; }
.btn--primary   { background:var(--color-black); color:#fff; }
.btn--secondary { background:var(--color-grey-100); color:var(--color-black); box-shadow:var(--shadow-soft); }
.btn:focus-visible { outline:2px solid var(--color-yellow-500); outline-offset:2px; }
```

---

### 4.3 Sidebar Navigation

- Kolom ikon, item berbentuk **lingkaran 48px**, jarak vertikal ±12px.
- **Aktif**: background hitam, ikon putih. **Nonaktif**: background `#E9E9E9`, ikon hitam outline.
- Urutan referensi: Dashboard · Analytics · Projects (folder) · Team/Clients · Finance · Billing/Payroll · Calendar · Settings — dan **Logout** terpisah di dasar.
- Wajib: `aria-label` + tooltip saat hover (karena tanpa teks); `aria-current="page"` untuk item aktif.

---

### 4.4 Topbar

- **Logo**: ikon bintang 4 sudut (monokrom hitam/abu), 32px.
- **Search bar**: pill, background `#E9E9E9`, tinggi ±40px, ikon search kiri, placeholder abu "Search anything here…", lebar fleksibel (max ±430px).
- **Aksi kanan**: icon button Chat, Notifikasi, lalu **Avatar** bulat 36px.

---

### 4.5 Page Header

- Judul `h1` + subjudul `body` abu.
- Rata kanan: grup tombol aksi (3 secondary + 1 primary, urutan: aksi ringan → aksi utama paling kanan).

---

### 4.6 Promo / Upgrade Card (glass)

- Gradient vertikal biru muda → peach/kuning (`--gradient-promo`).
- Isi: judul "Upgrade to Pro" + deskripsi singkat, **tombol close (X)** bulat translucent di kanan atas, ilustrasi 3D kristal/prisma di tengah.
- Bagian bawah: **panel "Free Trial"** (kuning translucent) berisi judul, **Badge "👑 7 Days"** (kuning solid), serta **Help Card** nested dan CTA **"Upgrade Now →"** (primary hitam, full width).
- Efek glass: `backdrop-filter: blur(16px)`, background `rgba(255,255,255,.35–.5)`, border `1px solid rgba(255,255,255,.6)`.

```css
.glass { background:rgba(255,255,255,.4); backdrop-filter:blur(16px);
         border:1px solid rgba(255,255,255,.6); border-radius:var(--radius-md); }
```

---

### 4.7 Badge / Chip

| Varian | Style | Contoh |
|---|---|---|
| **Accent badge** | bg `#FFCB5B`, teks hitam 12px/500, ikon di kiri, radius 10–12px | "👑 7 Days" |
| **Value tooltip** | sama dengan accent badge + ekor kecil (pointer) ke titik data | "$245.2K", "$32.5K" |
| **Legend toggle** | pill abu `#E9E9E9`; titik **terisi hitam** = aktif, **titik outline** = nonaktif | "● Revenue", "○ Expense" |
| **Status dot** | titik 8px + label caption | "In Progress (23)", "On Hold (3)" |

---

### 4.8 Stat Block (angka utama)

```
This Month Earning        ← label 12px, secondary
$284.5K                   ← stat 32px/500
↗ 12.5%                   ← 12px, --color-success, ikon panah miring
```
Tren turun memakai `--color-danger` dengan ikon ↘.

---

### 4.9 Line / Area Chart (Revenue Overview)

- Garis tipis abu dengan **titik hitam** (r≈3–4px) di setiap data point.
- Area di bawah garis diisi abu sangat muda (`#F1F1F1`), bentuk smooth (curve monotone).
- Sumbu X: label bulan caption abu; **tanpa gridline** dan tanpa sumbu Y.
- **Hover/aktif**: garis vertikal putus-putus + tooltip kuning (`$245.2K`) di atas titik.
- Legend toggle di kiri bawah (Revenue / Expense).
- Rekomendasi library: Recharts / Chart.js / visx; atau SVG kustom.

---

### 4.10 Gauge / Semi-Donut (Project Status)

- Busur 180°+ dengan stroke tebal ±14px, ujung membulat (`stroke-linecap: round`).
- Segmen: **In Progress** `#F5A800`, **Completed** `#FBE4A8`, **On Hold/Review** abu muda.
- Tengah: angka besar (`42`) + label "Active Projects".
- Di bawah: legenda 2×2 (dot + label + jumlah dalam kurung).

---

### 4.11 Progress Bar List (Team Performance)

- Baris: **nama** (label kiri atas) + **persentase** (kanan), di bawahnya track pill abu `#F1F1F1`/`#E9E9E9` tinggi ±20px.
- **Item sorotan/aktif**: fill kuning dengan **pola garis diagonal (hatched)**.

```css
.bar-fill--highlight {
  background: repeating-linear-gradient(135deg, #FFCB5B 0 4px, #F7B93A 4px 6px);
}
```
- Fill lebar = persentase (`width: 80%`).

---

### 4.12 List Item with Icon Tile (Active Projects)

```
[▢ icon]  Website Redesign                 ← 13–14px / 500
          Client: James Anderson           ← 11px muted
          ───────────────▬▬▬▬▬             ← progress tipis 3–4px
```
- Tile ikon: 36–40px, radius 12px, background abu muda, ikon outline.
- Progress tipis berwarna sesuai status: **kuning** (berjalan), **hijau** (hampir selesai), **merah** (terlambat/risiko).

---

### 4.13 Countdown (Next Meeting In)

- Judul kartu + expand button.
- Waktu `HH:MM:SS` ukuran `display` (48px), `tabular-nums`, hitam, rata kiri/tengah.
- Update tiap detik; tambahkan `aria-live="off"` (hindari announce tiap detik) dan `role="timer"`.

---

### 4.14 Avatar & Avatar Group (Top Clients)

- Avatar bulat 36–40px, **overlap** −8px (`margin-left: -8px`) dengan ring putih 2px.
- **Avatar terpilih**: ring kuning `#FFCB5B` 2px + **value tooltip** kuning di atasnya ("$32.5K").
- Avatar profil di topbar: 36px tanpa ring.

---

### 4.15 Icon Button kecil "Expand"

- Lingkaran 28–32px, background `#F1F1F1`/`#E9E9E9`, ikon maximize 14px.
- Posisi: pojok kanan atas setiap kartu → membuka detail/modal/fullscreen widget.

---

### 4.16 Help / Nested Card

- Background kuning translucent (`rgba(255,203,91,.25)`), radius 16px, padding 12–16px.
- Tile ikon (help-circle) di kiri + judul tebal + deskripsi caption.

---

## 5. Motion & Interaction

| Elemen | Animasi |
|---|---|
| Hover tombol/ikon | 150ms ease-out, ubah background / `translateY(-1px)` |
| Press | `scale(.98)`, 80ms |
| Kartu muncul | fade + translateY(8px→0), 250ms, stagger 40ms |
| Chart | garis digambar (stroke-dashoffset) 600ms; tooltip fade 120ms |
| Gauge & progress | animasi isi 500–700ms `cubic-bezier(.22,1,.36,1)` |
| Promo (kristal) | float lambat 6s infinite (opsional) |

Hormati `prefers-reduced-motion: reduce` → matikan animasi non-esensial.

---

## 6. Accessibility

- Kontras teks hitam `#101010` di atas putih/kuning/abu: **lulus AA/AAA**. Hindari teks putih di atas kuning.
- Teks `--color-text-muted` (#9A9A9A) hanya untuk label dekoratif ≥12px; untuk info penting gunakan `--color-text-secondary`.
- Jangan mengandalkan warna saja: status progress sertakan label/angka; legend punya teks.
- Semua icon-only button wajib `aria-label`; target sentuh minimal **40×40px** (mobile 44px).
- Fokus keyboard terlihat jelas (ring kuning).
- Chart: sediakan ringkasan teks / tabel alternatif.

---

## 7. Do & Don't

**Do**
- Gunakan kuning hanya untuk 1–2 titik fokus per kartu.
- Satu tombol primer hitam per area.
- Pertahankan radius besar & konsisten.
- Biarkan whitespace; hindari kartu terlalu penuh.

**Don't**
- Jangan tambah border tebal atau shadow berat.
- Jangan campur lebih dari satu warna aksen selain status (hijau/merah hanya untuk semantik).
- Jangan pakai glass pada semua kartu.
- Jangan pakai font selain Inter.

---

## 8. Component Checklist (untuk implementasi)

- [ ] Tokens (color, type, radius, spacing, shadow)
- [ ] `Button` (primary, secondary, icon, icon-active)
- [ ] `Card` (+ header + expand button, nested, promo/glass)
- [ ] `Sidebar` / `NavItem`
- [ ] `Topbar` (logo, search, icon buttons, avatar)
- [ ] `PageHeader` (title, subtitle, actions)
- [ ] `Badge` / `Tooltip` kuning / `LegendToggle` / `StatusDot`
- [ ] `StatBlock` + `TrendIndicator`
- [ ] `LineAreaChart`
- [ ] `GaugeChart`
- [ ] `ProgressBar` (+ varian hatched)
- [ ] `ListItem` (icon tile + progress)
- [ ] `Countdown`
- [ ] `AvatarGroup`
- [ ] `HelpCard`
- [ ] Responsive & dark mode (opsional, lihat §9)

---

## 9. Ekstensi (opsional) — Dark Mode

Referensi hanya light mode. Jika diperlukan, usulan pemetaan:

| Token | Light | Dark |
|---|---|---|
| canvas | `#EDEDED` | `#0A0A0A` |
| surface-app | `#F4F4F4` | `#141414` |
| card | `#FFFFFF` | `#1C1C1C` |
| grey-100 | `#E9E9E9` | `#2A2A2A` |
| text-primary | `#101010` | `#F5F5F5` |
| primary button | bg `#101010` / teks putih | bg `#FFFFFF` / teks `#101010` |
| yellow-500 | `#FFCB5B` | `#FFCB5B` (tetap) |

---

## 10. Quick Start (prompt untuk AI / developer)

> Bangun UI dengan mengikuti `Design.md`: font Inter, palet White `#FFFFFF`, Light Grey `#E9E9E9`, Yellow `#FFCB5B`, Black `#101010`. Gunakan layout bento-grid dengan kartu putih radius 24px tanpa border, sidebar ikon bulat (aktif hitam), tombol berbentuk pill (primer hitam, sekunder abu), aksen kuning untuk badge/tooltip/highlight, dan glass gradient hanya pada kartu promo.
