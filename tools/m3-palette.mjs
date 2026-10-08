/**
 * Generator palet Material 3 (tonal palette) — tanpa dependensi.
 *
 * Cara kerja:
 *  1. Seed sRGB dikonversi ke CIE Lab untuk mendapatkan hue (H) dan chroma (C).
 *  2. Setiap peran palet memakai hue sesuai spec M3:
 *       primary        = hue seed hitam Design.md, chroma maksimum dalam gamut
 *       secondary      = hue seed, batas chroma CHROMA.secondary
 *       tertiary       = hue seed aksen kuning, batas CHROMA.tertiary
 *                        (bukan hue + 60)
 *       success        = hue seed hijau semantik, batas CHROMA.success
 *       neutral        = hue seed, batas chroma CHROMA.neutral
 *       neutralVariant = hue seed, batas chroma CHROMA.neutralVariant
 *       error          = nilai tetap palet error M3 (hue 25)
 *     "Tone" M3 identik dengan lightness L* pada CIE Lab, sehingga properti
 *     aksesibilitas M3 (mis. tone 40 di atas tone 100) tetap terjaga.
 *  3. Untuk tiap tone, chroma ditekan lewat binary search sampai warnanya
 *     masuk gamut sRGB — inilah tahap "gamut mapping" versi sederhana.
 *
 * Pemakaian:
 *   node tools/m3-palette.mjs            # cetak laporan kontras
 *   node tools/m3-palette.mjs --css      # cetak blok CSS token
 *   node tools/m3-palette.mjs --splice   # ganti isi token di index.html
 *
 * Penyisipan memakai penanda berpasangan di dalam <style id="md-tokens">:
 * antara m3-tokens:start dan m3-tokens:end. Isi di antara kedua penanda
 * selalu boleh ditimpa, sehingga generator ini aman dijalankan berulang kali.
 *
 * Seed bisa diganti tanpa menyunting berkas ini:
 *   M3_SEED=#101010 M3_TERTIARY_SEED=#ffcb5b node tools/m3-palette.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

/* =========================================================
   KONVERSI WARNA
========================================================= */

const srgbToLinear = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const linearToSrgb = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(c * 255)));
};

const D65 = { x: 0.95047, y: 1.0, z: 1.08883 };

function hexToLinearRgb(hex) {
    const h = hex.replace("#", "");
    return [0, 1, 2].map((i) => srgbToLinear(parseInt(h.slice(i * 2, i * 2 + 2), 16)));
}

function linearRgbToXyz([r, g, b]) {
    return {
        x: 0.4123908 * r + 0.3575843 * g + 0.1804808 * b,
        y: 0.2126390 * r + 0.7151687 * g + 0.0721923 * b,
        z: 0.0193308 * r + 0.1191948 * g + 0.9505322 * b,
    };
}

function xyzToLinearRgb({ x, y, z }) {
    return [
        3.2409699 * x - 1.5373832 * y - 0.4986108 * z,
        -0.9692436 * x + 1.8759675 * y + 0.0415551 * z,
        0.0556301 * x - 0.2039770 * y + 1.0569715 * z,
    ];
}

const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fInv = (t) => (t > 6 / 29 ? t * t * t : 3 * (6 / 29) ** 2 * (t - 4 / 29));

function linearRgbToLab(rgb) {
    const { x, y, z } = linearRgbToXyz(rgb);
    const fx = f(x / D65.x);
    const fy = f(y / D65.y);
    const fz = f(z / D65.z);
    return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function labToLinearRgb({ L, a, b }) {
    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;
    return xyzToLinearRgb({
        x: fInv(fx) * D65.x,
        y: fInv(fy) * D65.y,
        z: fInv(fz) * D65.z,
    });
}

function hexToHueChroma(hex) {
    const lab = linearRgbToLab(hexToLinearRgb(hex));
    return {
        hue: (Math.atan2(lab.b, lab.a) * 180) / Math.PI,
        chroma: Math.hypot(lab.a, lab.b),
    };
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.0008 && v <= 1.0008);

/* =========================================================
   TONAL PALETTE
========================================================= */

/*
 * Tone 4, 46, 64, dan 92 sengaja ada di daftar: keempatnya adalah titik
 * jatuh warna Design.md pada tangga tone M3 (lihat peta peran di bawah).
 */
const TONES = [0, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 46, 50, 60, 64, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100];

/** Warna pada lightness (tone) tertentu dengan hue & batas chroma M3. */
function tone(hue, chromaLimit, toneValue) {
    const rad = (hue * Math.PI) / 180;
    const L = toneValue;

    let lo = 0;
    let hi = Math.max(chromaLimit, 0.001);

    const toRgb = (c) => labToLinearRgb({ L, a: Math.cos(rad) * c, b: Math.sin(rad) * c });

    for (let i = 0; i < 40; i += 1) {
        const mid = (lo + hi) / 2;
        if (inGamut(toRgb(mid))) lo = mid;
        else hi = mid;
    }

    const rgb = toRgb(lo).map(linearToSrgb);
    return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function buildPalette(hue, chromaLimit) {
    const out = {};
    TONES.forEach((t) => {
        out[t] = tone(hue, chromaLimit, t);
    });
    return out;
}

/* Palet error M3 memakai hue tetap (25 pada HCT) — nilai baku Material. */
const ERROR = {
    0: "#000000", 10: "#410e0b", 20: "#601410", 30: "#8c1d18", 40: "#b3261e",
    50: "#dc362e", 60: "#e46962", 70: "#ec928e", 80: "#f2b8b5", 90: "#f9dedc",
    95: "#fceeee", 99: "#fffbf9", 100: "#ffffff",
};

/*
 * Tiga seed, bukan satu.
 *
 * Seed tinta adalah **hitam Design.md `#101010`**: bukan tinta berwarna,
 * melainkan titik nol. Karena chromanya nol, seluruh palet primary,
 * secondary, neutral, dan neutralVariant keluar sebagai abu-abu murni —
 * persis prinsip "monokrom + satu aksen" di Design.md §1.
 *
 * Spec M3 menurunkan tertiary dari (hue + 60); di aplikasi ini tertiary
 * memikul peran lain, yaitu **aksen kuning `#FFCB5B`** Design.md, sehingga
 * diturunkan dari seed-nya sendiri. Penyimpangan dari hue + 60 itu disengaja
 * dan hanya menyentuh palet tertiary.
 *
 * Seed ketiga, hijau `#16a34a`, hanya dipakai untuk dua token semantik
 * (--app-success-container dan --app-success-ink). Design.md §1 menetapkan
 * hijau/merah sebagai warna semantik, bukan warna struktur, jadi ia tidak
 * pernah muncul sebagai primary/secondary/tertiary.
 */
const SEED = process.env.M3_SEED || "#101010";
const TERTIARY_SEED = process.env.M3_TERTIARY_SEED || "#ffcb5b";
const SUCCESS_SEED = process.env.M3_SUCCESS_SEED || "#16a34a";

const { hue, chroma } = hexToHueChroma(SEED);
const tertiaryHue = hexToHueChroma(TERTIARY_SEED).hue;
const successHue = hexToHueChroma(SUCCESS_SEED).hue;

/*
 * Batas chroma per peran.
 *
 * secondary, neutral, dan neutralVariant sengaja 0: Design.md tidak memakai
 * warna struktur selain hitam-putih-abu, jadi ketiganya harus keluar sebagai
 * abu netral. Sebelumnya nilainya dinaikkan (40/8/18) supaya permukaan ikut
 * berwarna; identitas itu sudah tidak dipakai lagi.
 */
const CHROMA = {
    secondary: 0,
    tertiary: 52,
    /*
     * Hijau semantik sengaja jauh lebih rendah: pada chroma 52, tone 92 keluar
     * sebagai mint neon #a0fdaf — lencana "terbaca" yang berteriak. Design.md
     * memakai hijau hanya sebagai penanda halus (§1: hijau/merah hanya untuk
     * semantik), jadi limpahannya ditahan di 24.
     */
    success: 24,
    neutral: 0,
    neutralVariant: 0,
};

const PALETTES = {
    primary: buildPalette(hue, chroma),
    secondary: buildPalette(hue, CHROMA.secondary),
    tertiary: buildPalette(tertiaryHue, CHROMA.tertiary),
    success: buildPalette(successHue, CHROMA.success),
    neutral: buildPalette(hue, CHROMA.neutral),
    neutralVariant: buildPalette(hue, CHROMA.neutralVariant),
    error: ERROR,
};

/*
 * Token aplikasi yang juga diturunkan dari palet, jadi harus ikut dihasilkan.
 *
 * --app-accent  : kuning mentah Design.md (#FFCB5B) untuk *isian* yang
 *                 ditumpangi tinta hitam (badge, bar aksen).
 * --app-accent-strong : kuning lebih pekat (Design.md yellow-600) untuk
 *                 penanda aktif seperti isian gauge/progress.
 * --app-focus-ring : kuning yang digelapkan (tone 50) sampai lolos ambang
 *                 kontras non-teks 3:1 di atas permukaan terang, sebab cincin
 *                 fokus kuning mentah Design.md hanya 1,3:1 di atas putih.
 *                 Laporan kontras di bawah mengaudit pasangan ini.
 */
const LOGO_TILE = PALETTES.primary[92];
const LOGO_INK = PALETTES.primary[4];
const THEME_COLOR_LIGHT = PALETTES.neutral[100];
const THEME_COLOR_DARK = PALETTES.neutral[6];
const ACCENT = TERTIARY_SEED.toUpperCase();
const ACCENT_STRONG = PALETTES.tertiary[70];
const FOCUS_RING = PALETTES.tertiary[50];
const SUCCESS_LIGHT = PALETTES.success[92];
const SUCCESS_INK_LIGHT = PALETTES.success[40];
const SUCCESS_DARK = PALETTES.success[30];
const SUCCESS_INK_DARK = PALETTES.success[80];

/* =========================================================
   PEMETAAN PERAN WARNA (md.sys.color.*)
========================================================= */

/*
 * Peta peran skema terang.
 *
 * Beberapa tone menyimpang dari M3 baku supaya jatuh tepat di nilai Design.md
 * (kolom "Hex" dokumen itu):
 *   tone 4  = #101010  → hitam Design.md, dipakai sebagai primary
 *   tone 46 = #6c6c6c  → text-secondary Design.md (#6B6B6B)
 *   tone 92 = #e8e8e8  → Light Grey Design.md (#E9E9E9)
 *   tone 94 = #eeeeee  → canvas Design.md (#EDEDED)
 *   tone 96 = #f5f5f5  → surface-app Design.md (#F4F4F4)
 * Penyimpangan yang punya alasan: primary skema terang memakai tone 4 (bukan
 * 40) karena Design.md menuntut tombol primer benar-benar hitam, dan kartu
 * memakai tone 100 (bukan 98) supaya di atas kanvas tone 96 kartunya putih
 * bersih seperti di referensi. Semua sisanya masih mengikuti pola M3.
 */
const LIGHT_ROLES = [
    ["primary", "primary", 4], ["on-primary", "primary", 100],
    ["primary-container", "primary", 92], ["on-primary-container", "primary", 4],
    ["secondary", "secondary", 46], ["on-secondary", "secondary", 100],
    ["secondary-container", "secondary", 92], ["on-secondary-container", "secondary", 4],
    ["tertiary", "tertiary", 40], ["on-tertiary", "tertiary", 100],
    ["tertiary-container", "tertiary", 92], ["on-tertiary-container", "tertiary", 4],
    ["error", "error", 40], ["on-error", "error", 100],
    ["error-container", "error", 90], ["on-error-container", "error", 10],
    ["background", "neutral", 96], ["on-background", "neutral", 4],
    ["surface", "neutral", 96], ["on-surface", "neutral", 4],
    ["surface-variant", "neutralVariant", 92], ["on-surface-variant", "neutralVariant", 46],
    ["surface-dim", "neutral", 90], ["surface-bright", "neutral", 100],
    ["surface-container-lowest", "neutral", 100], ["surface-container-low", "neutral", 100],
    ["surface-container", "neutral", 94], ["surface-container-high", "neutral", 92],
    ["surface-container-highest", "neutral", 92],
    ["outline", "neutralVariant", 50], ["outline-variant", "neutralVariant", 80],
    ["inverse-surface", "neutral", 4], ["inverse-on-surface", "neutral", 96],
    ["inverse-primary", "primary", 80],
    ["scrim", "neutral", 0], ["shadow", "neutral", 0], ["surface-tint", "primary", 4],
];

/*
 * Peta peran skema gelap — mengikuti pemetaan Dark Mode usulan Design.md §9:
 * kanvas/window #141414 (tone 6), kartu #1C1C1C (tone 12), kontrol #2A2A2A
 * (tone 17), teks utama #F5F5F5 (tone 96), tombol primer putih dengan tinta
 * hitam. Kuning tetap sama di kedua skema.
 */
const DARK_ROLES = [
    ["primary", "primary", 100], ["on-primary", "primary", 4],
    ["primary-container", "primary", 17], ["on-primary-container", "primary", 92],
    ["secondary", "secondary", 92], ["on-secondary", "secondary", 4],
    ["secondary-container", "secondary", 17], ["on-secondary-container", "secondary", 92],
    ["tertiary", "tertiary", 80], ["on-tertiary", "tertiary", 20],
    ["tertiary-container", "tertiary", 30], ["on-tertiary-container", "tertiary", 90],
    ["error", "error", 80], ["on-error", "error", 20],
    ["error-container", "error", 30], ["on-error-container", "error", 90],
    ["background", "neutral", 6], ["on-background", "neutral", 96],
    ["surface", "neutral", 6], ["on-surface", "neutral", 96],
    ["surface-variant", "neutralVariant", 17], ["on-surface-variant", "neutralVariant", 64],
    ["surface-dim", "neutral", 6], ["surface-bright", "neutral", 24],
    ["surface-container-lowest", "neutral", 12], ["surface-container-low", "neutral", 12],
    ["surface-container", "neutral", 17], ["surface-container-high", "neutral", 17],
    ["surface-container-highest", "neutral", 17],
    ["outline", "neutralVariant", 60], ["outline-variant", "neutralVariant", 30],
    ["inverse-surface", "neutral", 92], ["inverse-on-surface", "neutral", 4],
    ["inverse-primary", "primary", 80],
    ["scrim", "neutral", 0], ["shadow", "neutral", 0], ["surface-tint", "primary", 100],
];

const hexToRgbTriplet = (hex) => {
    const h = hex.replace("#", "");
    return [0, 1, 2].map((i) => parseInt(h.slice(i * 2, i * 2 + 2), 16)).join(" ");
};

function roleLines(roles, indent = "  ") {
    return roles
        .map(([name, palette, t]) => {
            const hex = PALETTES[palette][t];
            if (!hex) throw new Error(`Tone ${t} tidak tersedia di palet ${palette}`);
            return (
                `${indent}--md-sys-color-${name}: ${hex};\n` +
                `${indent}--md-sys-color-${name}-rgb: ${hexToRgbTriplet(hex)};`
            );
        })
        .join("\n");
}

/*
 * Token aplikasi tambahan: aksen, cincin fokus, dan hijau semantik.
 * Accent dan focus ring sama di kedua skema (kuning tetap kuning di latar
 * gelap), sedangkan hijau punya varian gelap karena container dan tintanya
 * bertukar peran.
 */
function lightAppTokens(indent) {
    return [
        `${indent}/*`,
        `${indent} * Aksen & semantik Design.md. Nilainya ikut diaudit laporan kontras`,
        `${indent} * di bawah: --app-focus-ring digelapkan dari kuning mentah karena`,
        `${indent} * cincin fokus harus lolos 3:1 di atas permukaan terang.`,
        `${indent} */`,
        `${indent}--app-accent: ${ACCENT};`,
        `${indent}--app-accent-rgb: ${hexToRgbTriplet(ACCENT)};`,
        `${indent}/* Tinta di atas isian aksen: hitam tetap hitam di kedua skema. */`,
        `${indent}--app-accent-ink: ${PALETTES.primary[4]};`,
        `${indent}--app-accent-ink-rgb: ${hexToRgbTriplet(PALETTES.primary[4])};`,
        `${indent}--app-accent-strong: ${ACCENT_STRONG};`,
        `${indent}--app-focus-ring: ${FOCUS_RING};`,
        `${indent}--app-success-container: ${SUCCESS_LIGHT};`,
        `${indent}--app-success-ink: ${SUCCESS_INK_LIGHT};`,
    ];
}

function darkAppTokens(indent) {
    return [
        `${indent}--app-success-container: ${SUCCESS_DARK};`,
        `${indent}--app-success-ink: ${SUCCESS_INK_DARK};`,
    ];
}

/*
 * Seed hitam tidak punya sudut hue yang berarti: chromanya nol, sehingga
 * atan2(0, 0) menghasilkan angka acak (-100,1° pada seed bawaan). Menuliskan
 * "netral" lebih jujur daripada mencetak sudut yang tidak dipakai apa pun.
 */
const hueLabel = (angle, chroma2) => (chroma2 < 0.5 ? "netral" : `hue ${angle.toFixed(1)}°`);

function cssTokens() {
    return [
        "/* m3-tokens:start */",
        "/* =========================================================",
        "   TOKEN WARNA — dihasilkan oleh tools/m3-palette.mjs",
        `   Tinta: ${SEED.toUpperCase()} (${hueLabel(hue, chroma)}, chroma ${chroma.toFixed(1)})`,
        `   Aksen: ${TERTIARY_SEED.toUpperCase()} (hue ${tertiaryHue.toFixed(1)}°)`,
        `   Hijau semantik: ${SUCCESS_SEED.toUpperCase()} (hue ${successHue.toFixed(1)}°)`,
        "   Peran warna tetap mengikuti skema Material 3: terang (default),",
        "   gelap, dan gelap-otomatis lewat preferensi sistem.",
        "   Jangan disunting manual, jalankan ulang generatornya supaya nilai",
        "   seperti ujung gradasi ikon logo tidak tertinggal dari paletnya.",
        "========================================================= */",
        "",
        ":root {",
        "    color-scheme: light;",
        roleLines(LIGHT_ROLES),
        "",
        "    /*",
        "     * Pasangan ujung gradasi ikon logo. Keduanya ditulis di blok terang",
        "     * dan sengaja tidak ditimpa blok gelap: ujung gelapnya memakai tone 4,",
        "     * bukan primary versi tema aktif, sebab gradasinya memang harus",
        "     * monokrom — hitam pekat dengan kilau abu terang.",
        "     */",
        `    --app-logo-tile: ${LOGO_TILE};`,
        `    --app-logo-ink: ${LOGO_INK};`,
        "",
        "    /* Dipakai JS untuk mewarnai chrome peramban mengikuti tema aktif. */",
        `    --app-theme-color-light: ${THEME_COLOR_LIGHT};`,
        `    --app-theme-color-dark: ${THEME_COLOR_DARK};`,
        "",
        ...lightAppTokens("    "),
        "}",
        "",
        '[data-theme="dark"] {',
        "    color-scheme: dark;",
        roleLines(DARK_ROLES),
        "",
        ...darkAppTokens("    "),
        "}",
        "",
        "@media (prefers-color-scheme: dark) {",
        '    [data-theme="auto"] {',
        "        color-scheme: dark;",
        roleLines(DARK_ROLES, "        "),
        "",
        ...darkAppTokens("        "),
        "    }",
        "}",
        "",
        "/* m3-tokens:end */",
    ].join("\n");
}

/* =========================================================
   VERIFIKASI KONTRAS
========================================================= */

const lum = (hex) => {
    const [r, g, b] = hexToLinearRgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function contrast(a, b) {
    const la = lum(a);
    const lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function report() {
    const checks = [
        ["body", "on-surface", "surface", 4.5],
        ["peringatan (teks)", "tertiary", "surface", 4.5],
        ["peringatan (ikon)", "tertiary", "surface-container-low", 3],
        ["body/varian", "on-surface-variant", "surface", 4.5],
        ["body/kartu", "on-surface", "surface-container-low", 4.5],
        ["kartu/varian", "on-surface-variant", "surface-container-low", 4.5],
        ["teks-utama", "primary", "surface", 4.5],
        ["button-filled", "on-primary", "primary", 4.5],
        ["button-tonal", "on-secondary-container", "secondary-container", 4.5],
        ["chip-selected", "on-secondary-container", "secondary-container", 4.5],
        ["outline", "outline", "surface", 3],
        ["outline-variant", "outline-variant", "surface-container-low", 1.3],
        ["error", "error", "surface-container-low", 4.5],
        ["dialog", "on-surface", "surface-container-high", 4.5],
        ["snackbar", "inverse-on-surface", "inverse-surface", 4.5],
        ["panel-icon", "on-primary-container", "primary-container", 4.5],
    ];

    /*
     * Pasangan tambahan yang tidak ada di peta peran: cincin fokus dan hijau
     * semantik berasal dari token aplikasi, bukan dari md.sys.color.*.
     */
    const extraChecks = [
        ["cincin fokus / permukaan", FOCUS_RING, PALETTES.neutral[96], 3],
        ["cincin fokus / kartu", FOCUS_RING, PALETTES.neutral[100], 3],
        ["cincin fokus / gelap", FOCUS_RING, PALETTES.neutral[6], 3],
        ["tinta di atas kuning", PALETTES.neutral[4], ACCENT, 4.5],
        ["hijau semantik", SUCCESS_INK_LIGHT, SUCCESS_LIGHT, 4.5],
        ["hijau semantik / gelap", SUCCESS_INK_DARK, SUCCESS_DARK, 4.5],
    ];

    const rows = [];
    let failed = 0;

    [["TERANG", LIGHT_ROLES], ["GELAP", DARK_ROLES]].forEach(([label, roles]) => {
        const map = Object.fromEntries(roles.map(([n, p, t]) => [n, PALETTES[p][t]]));
        rows.push(`\n== SKEMA ${label} ==`);
        checks.forEach(([name, fg, bg, min]) => {
            const ratio = contrast(map[fg], map[bg]);
            const ok = ratio >= min;
            if (!ok) failed += 1;
            rows.push(
                `  ${ok ? "OK  " : "GAGAL"} ${name.padEnd(15)} ${map[fg]} / ${map[bg]}  ${ratio.toFixed(2)}:1 (min ${min})`
            );
        });
    });

    rows.push("\n== AKSEN & SEMANTIK ==");
    extraChecks.forEach(([name, fg, bg, min]) => {
        const ratio = contrast(fg, bg);
        const ok = ratio >= min;
        if (!ok) failed += 1;
        rows.push(
            `  ${ok ? "OK  " : "GAGAL"} ${name.padEnd(22)} ${fg} / ${bg}  ${ratio.toFixed(2)}:1 (min ${min})`
        );
    });

    /*
     * Ujung gradasi logo tidak berganti tema, jadi diperiksa satu kali di luar
     * kedua skema. Ambang 3 karena ini grafis, bukan teks.
     */
    rows.push("\n== LOGO ==");
    const logoRatio = contrast(LOGO_INK, LOGO_TILE);
    const logoOk = logoRatio >= 3;
    if (!logoOk) failed += 1;
    rows.push(
        `  ${logoOk ? "OK  " : "GAGAL"} ${"logo/tile".padEnd(15)} ${LOGO_INK} / ${LOGO_TILE}  ${logoRatio.toFixed(2)}:1 (min 3)`
    );

    rows.push(`\nTone Design.md pada palet netral (4 / 46 / 92 / 94 / 96 / 100):`);
    [4, 46, 92, 94, 96, 100].forEach((t) => {
        rows.push(`  tone ${String(t).padStart(3)}  ${PALETTES.neutral[t]}`);
    });

    rows.push(`\nRingkasan palet (tone 4 / 46 / 92):`);
    Object.entries(PALETTES).forEach(([name, p]) => {
        rows.push(`  ${name.padEnd(15)} ${p[4] || "-"}  ${p[46] || "-"}  ${p[92] || "-"}`);
    });

    rows.push(`\nToken aplikasi yang ikut dihasilkan:`);
    rows.push(`  --app-logo-tile          ${LOGO_TILE}`);
    rows.push(`  --app-logo-ink           ${LOGO_INK}`);
    rows.push(`  --app-accent             ${ACCENT}   (kuning Design.md)`);
    rows.push(`  --app-accent-strong      ${ACCENT_STRONG}`);
    rows.push(`  --app-focus-ring         ${FOCUS_RING}`);
    rows.push(`  --app-success-container  ${SUCCESS_LIGHT}   (gelap: ${SUCCESS_DARK})`);
    rows.push(`  --app-success-ink        ${SUCCESS_INK_LIGHT}   (gelap: ${SUCCESS_INK_DARK})`);
    rows.push(`  --app-theme-color-light  ${THEME_COLOR_LIGHT}   (meta theme-color terang)`);
    rows.push(`  --app-theme-color-dark   ${THEME_COLOR_DARK}   (meta theme-color gelap)`);

    console.log(rows.join("\n"));
    console.log(failed ? `\n${failed} pasangan gagal kontras.` : "\nSemua pasangan lolos ambang kontras.");
    return failed;
}

/* =========================================================
   CLI
========================================================= */

const args = process.argv.slice(2);

if (args.includes("--css")) {
    process.stdout.write(cssTokens());
} else if (args.includes("--splice")) {
    const target = "index.html";
    const startMarker = "/* m3-tokens:start */";
    const endMarker = "/* m3-tokens:end */";

    if (!existsSync(target)) {
        console.error("index.html belum ada.");
        process.exit(1);
    }

    const html = readFileSync(target, "utf8");
    const from = html.indexOf(startMarker);
    const to = html.indexOf(endMarker);

    if (from === -1 || to === -1 || to < from) {
        console.error(
            "Penanda m3-tokens:start dan m3-tokens:end tidak ditemukan berpasangan di index.html."
        );
        process.exit(1);
    }

    const next = html.slice(0, from) + cssTokens() + html.slice(to + endMarker.length);
    writeFileSync(target, next, "utf8");

    const before = html.slice(from, to).split("\n").length;
    const after = cssTokens().split("\n").length;
    console.log(`Token diganti di index.html: ${before} baris menjadi ${after} baris.`);
} else {
    process.exit(report() ? 1 : 0);
}
