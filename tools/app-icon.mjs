/*
 * tools/app-icon.mjs — menyiapkan ikon aplikasi dari icon.png.
 *
 * Hasilnya disisipkan ke index.html di antara penanda
 *
 *   <!-- app-icon:start --> ... <!-- app-icon:end -->
 *
 * sebagai data URL PNG **abu-abu + alpha** (hanya terang-gelap + transparansi).
 * Warnanya sengaja tidak ikut disimpan: setiap tema mewarnai ulang lapisan itu
 * di peramban oleh wireAppIcon() memakai token --app-logo-tile dan
 * --app-logo-ink milik tema yang sedang aktif. Karena itu ikon tab ikut
 * berganti warna begitu temanya berganti, dan berkasnya tetap kecil.
 *
 *   node tools/app-icon.mjs             # perbarui blok di index.html
 *   node tools/app-icon.mjs --check     # periksa saja (keluar 1 bila beda)
 *   node tools/app-icon.mjs --stdout    # cetak data URL-nya
 *   node tools/app-icon.mjs --size=96   # ganti ukuran tepi (bawaan 128)
 *   node tools/app-icon.mjs --keep      # jangan potong tepi transparan
 *
 * Jalankan ulang setiap kali icon.png diganti; blok di index.html adalah
 * artefak yang dihasilkan, bukan sumber yang disunting tangan.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ICON_PATH = path.join(ROOT, "icon.png");
const TARGET_PATH = path.join(ROOT, "index.html");

const START_MARKER = "<!-- app-icon:start -->";
const END_MARKER = "<!-- app-icon:end -->";

const DEFAULT_SIZE = 128;

/* Piksel dengan alpha di bawah ambang ini dianggap kosong saat mencari tepi. */
const ALPHA_FLOOR = 8;

/* Sisa tepi transparan yang dipertahankan setelah pemotongan otomatis. */
const PADDING = 0.03;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);


/* =========================================================
   PNG — BACA
========================================================= */

/*
 * Pembaca PNG seadanya: 8 bit per kanal, tanpa interlace, untuk tipe warna
 * 0 (abu-abu), 2 (RGB), 4 (abu-abu+alpha), dan 6 (RGBA). Itu semua yang
 * dibutuhkan icon.png; tipe lain ditolak dengan pesan yang jelas alih-alih
 * menghasilkan gambar rusak.
 */
function decodePNG(buffer) {
    if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
        throw new Error("Berkasnya bukan PNG.");
    }

    const header = readChunk(buffer, 8);
    const width = header.data.readUInt32BE(0);
    const height = header.data.readUInt32BE(4);
    const bitDepth = header.data[8];
    const colorType = header.data[9];
    const interlace = header.data[12];

    if (bitDepth !== 8) {
        throw new Error("Hanya PNG 8 bit per kanal yang didukung (ditemukan " + bitDepth + ").");
    }

    if (interlace !== 0) {
        throw new Error("PNG dengan interlace tidak didukung.");
    }

    const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];

    if (!channels) {
        throw new Error("Tipe warna PNG " + colorType + " tidak didukung (pakai 0, 2, 4, atau 6).");
    }

    const idat = [];
    let offset = 8;

    while (offset < buffer.length) {
        const chunk = readChunk(buffer, offset);

        if (chunk.type === "IDAT") {
            idat.push(chunk.data);
        }

        if (chunk.type === "IEND") {
            break;
        }

        offset += 12 + chunk.length;
    }

    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = width * channels;
    const pixels = Buffer.alloc(stride * height);

    for (let y = 0; y < height; y++) {
        const type = raw[y * (stride + 1)];
        const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
        const out = y * stride;

        for (let x = 0; x < stride; x++) {
            const a = x >= channels ? pixels[out + x - channels] : 0;
            const b = y > 0 ? pixels[out - stride + x] : 0;
            const c = x >= channels && y > 0 ? pixels[out - stride + x - channels] : 0;

            pixels[out + x] = (line[x] + unfilter(type, a, b, c)) & 255;
        }
    }

    /* Semua tipe diperluas ke RGBA supaya sisa skrip hanya menangani satu bentuk. */
    const rgba = new Uint8Array(width * height * 4);

    for (let i = 0, p = 0; i < width * height; i++, p += channels) {
        if (colorType === 6) {
            rgba[i * 4] = pixels[p];
            rgba[i * 4 + 1] = pixels[p + 1];
            rgba[i * 4 + 2] = pixels[p + 2];
            rgba[i * 4 + 3] = pixels[p + 3];
        } else if (colorType === 2) {
            rgba[i * 4] = pixels[p];
            rgba[i * 4 + 1] = pixels[p + 1];
            rgba[i * 4 + 2] = pixels[p + 2];
            rgba[i * 4 + 3] = 255;
        } else if (colorType === 4) {
            rgba[i * 4] = pixels[p];
            rgba[i * 4 + 1] = pixels[p];
            rgba[i * 4 + 2] = pixels[p];
            rgba[i * 4 + 3] = pixels[p + 1];
        } else {
            rgba[i * 4] = pixels[p];
            rgba[i * 4 + 1] = pixels[p];
            rgba[i * 4 + 2] = pixels[p];
            rgba[i * 4 + 3] = 255;
        }
    }

    return { width, height, rgba };
}

function readChunk(buffer, offset) {
    const length = buffer.readUInt32BE(offset);

    return {
        length,
        type: buffer.subarray(offset + 4, offset + 8).toString("latin1"),
        data: buffer.subarray(offset + 8, offset + 8 + length)
    };
}

function unfilter(type, a, b, c) {
    if (type === 1) {
        return a;
    }

    if (type === 2) {
        return b;
    }

    if (type === 3) {
        return (a + b) >> 1;
    }

    if (type === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);

        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    }

    return 0;
}


/* =========================================================
   PNG — TULIS (abu-abu + alpha)
========================================================= */

const CRC_TABLE = (() => {
    const table = new Int32Array(256);

    for (let n = 0; n < 256; n++) {
        let c = n;

        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }

        table[n] = c;
    }

    return table;
})();

function crc32(buffer) {
    let c = -1;

    for (let i = 0; i < buffer.length; i++) {
        c = CRC_TABLE[(c ^ buffer[i]) & 255] ^ (c >>> 8);
    }

    return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
    const head = Buffer.alloc(8);

    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "latin1");

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);

    return Buffer.concat([head, data, crc]);
}

/*
 * Baris disaring dengan heuristik standar (jumlah nilai absolut terkecil):
 * gambar gradasi seperti ini menyusut jauh dibandingkan filter "none" untuk
 * semua baris, dan sisa berkasnya jadi kecil.
 */
function filterScanlines(bytes, width, height) {
    const bpp = 2;
    const stride = width * bpp;
    const out = Buffer.alloc(height * (stride + 1));
    let previous = Buffer.alloc(stride);

    for (let y = 0; y < height; y++) {
        const row = bytes.subarray(y * stride, (y + 1) * stride);
        let best = null;

        for (let type = 0; type <= 4; type++) {
            const line = Buffer.alloc(stride);
            let cost = 0;

            for (let x = 0; x < stride; x++) {
                const a = x >= bpp ? row[x - bpp] : 0;
                const b = previous[x];
                const c = x >= bpp ? previous[x - bpp] : 0;
                const value = (row[x] - unfilter(type, a, b, c)) & 255;

                line[x] = value;
                cost += Math.min(value, 256 - value);
            }

            if (!best || cost < best.cost) {
                best = { type, line, cost };
            }
        }

        out[y * (stride + 1)] = best.type;
        best.line.copy(out, y * (stride + 1) + 1);
        previous = row;
    }

    return out;
}

function encodeGrayAlphaPNG(width, height, bytes) {
    const ihdr = Buffer.alloc(13);

    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;    // kedalaman bit
    ihdr[9] = 4;    // abu-abu + alpha
    ihdr[10] = 0;   // kompresi deflate
    ihdr[11] = 0;   // filter standar
    ihdr[12] = 0;   // tanpa interlace

    return Buffer.concat([
        PNG_SIGNATURE,
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", zlib.deflateSync(filterScanlines(bytes, width, height), { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0))
    ]);
}


/* =========================================================
   GAMBAR → LAPISAN TERANG-GELAP
========================================================= */

/* Tepi gambar: bagian yang benar-benar berisi, tanpa tepi transparan kosong. */
function contentBox(rgba, width, height) {
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (rgba[(y * width + x) * 4 + 3] <= ALPHA_FLOOR) {
                continue;
            }

            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
        }
    }

    if (right < 0) {
        throw new Error("icon.png sepenuhnya transparan — tidak ada gambar untuk dipakai.");
    }

    /*
     * Kotak dibuat persegi supaya logo tidak gepeng: sisi yang pendek
     * diperlebar seimbang ke dua arah, lalu ditambah sedikit tepi.
     */
    const side = Math.max(right - left + 1, bottom - top + 1);
    const pad = Math.round(side * PADDING);
    const centreX = (left + right + 1) / 2;
    const centreY = (top + bottom + 1) / 2;
    const box = side + pad * 2;

    return {
        x: centreX - box / 2,
        y: centreY - box / 2,
        size: box
    };
}

/*
 * Pengecilan dengan filter kotak atas nilai ter-premultiply: warna tepi yang
 * tembus pandang tidak ikut mengotori hasilnya, sehingga tepi logonya halus
 * dan tidak berbingkai.
 */
function resizeToGrayAlpha(rgba, width, height, box, size) {
    const bytes = Buffer.alloc(size * size * 2);
    const scale = box.size / size;

    for (let y = 0; y < size; y++) {
        const y0 = box.y + y * scale;
        const y1 = y0 + scale;

        for (let x = 0; x < size; x++) {
            const x0 = box.x + x * scale;
            const x1 = x0 + scale;

            let sumA = 0;
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let sumWeight = 0;

            const firstY = Math.max(0, Math.floor(y0));
            const lastY = Math.min(height - 1, Math.ceil(y1) - 1);
            const firstX = Math.max(0, Math.floor(x0));
            const lastX = Math.min(width - 1, Math.ceil(x1) - 1);

            for (let sy = firstY; sy <= lastY; sy++) {
                const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);

                if (wy <= 0) {
                    continue;
                }

                for (let sx = firstX; sx <= lastX; sx++) {
                    const wx = Math.min(sx + 1, x1) - Math.max(sx, x0);

                    if (wx <= 0) {
                        continue;
                    }

                    const weight = wx * wy;
                    const p = (sy * width + sx) * 4;
                    const alpha = rgba[p + 3] / 255;

                    sumA += alpha * weight;
                    sumR += rgba[p] * alpha * weight;
                    sumG += rgba[p + 1] * alpha * weight;
                    sumB += rgba[p + 2] * alpha * weight;
                    sumWeight += weight;
                }
            }

            const index = (y * size + x) * 2;

            if (!sumWeight || sumA <= 0) {
                bytes[index] = 0;
                bytes[index + 1] = 0;
                continue;
            }

            /*
             * Terangnya dihitung dari warna aslinya (setelah alpha dibagi
             * keluar), karena itulah yang dipetakan ke warna tema di peramban.
             */
            const r = sumR / sumA;
            const g = sumG / sumA;
            const b = sumB / sumA;
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            bytes[index] = Math.round(Math.min(255, Math.max(0, luminance)));
            bytes[index + 1] = Math.round(Math.min(255, Math.max(0, (sumA / sumWeight) * 255)));
        }
    }

    return bytes;
}


/* =========================================================
   SISIPKAN KE index.html
========================================================= */

function dataUrlFor(source, size, crop) {
    const { width, height, rgba } = decodePNG(source);
    const box = crop
        ? contentBox(rgba, width, height)
        : { x: 0, y: 0, size: Math.max(width, height) };
    const layers = resizeToGrayAlpha(rgba, width, height, box, size);

    /* Diperiksa sendiri: hasilnya dibaca ulang dan dibandingkan. */
    const encoded = encodeGrayAlphaPNG(size, size, layers);
    const back = decodePNG(encoded);

    if (back.width !== size || back.height !== size) {
        throw new Error("Ukuran PNG hasil tidak sesuai.");
    }

    let worst = 0;

    for (let i = 0; i < size * size; i++) {
        worst = Math.max(
            worst,
            Math.abs(back.rgba[i * 4] - layers[i * 2]),
            Math.abs(back.rgba[i * 4 + 3] - layers[i * 2 + 1])
        );
    }

    if (worst !== 0) {
        throw new Error("PNG hasil tidak dapat dibaca ulang dengan tepat (selisih " + worst + ").");
    }

    const url = "data:image/png;base64," + encoded.toString("base64");

    return { url, bytes: encoded.length, size };
}

function splice(html, payload) {
    const start = html.indexOf(START_MARKER);
    const end = html.indexOf(END_MARKER);

    if (start < 0 || end < 0 || end < start) {
        throw new Error(
            "Penanda " + START_MARKER + " / " + END_MARKER + " tidak ditemukan di index.html."
        );
    }

    return (
        html.slice(0, start + START_MARKER.length) +
        "\n" +
        payload +
        "\n" +
        html.slice(end)
    );
}

function currentBlock(html) {
    const start = html.indexOf(START_MARKER);
    const end = html.indexOf(END_MARKER);

    if (start < 0 || end < 0 || end < start) {
        return "";
    }

    const inner = html.slice(start + START_MARKER.length, end);
    const script = /<script[^>]*id="appIconSource"[^>]*>([\s\S]*?)<\/script>/.exec(inner);

    return script ? script[1].trim() : "";
}


/* =========================================================
   PROGRAM
========================================================= */

function readOption(name, fallback) {
    const found = process.argv.find(argument => argument.startsWith("--" + name + "="));

    return found ? Number(found.split("=")[1]) : fallback;
}

function main() {
    const size = readOption("size", DEFAULT_SIZE);

    if (!Number.isInteger(size) || size < 16 || size > 512) {
        console.error("--size harus bilangan bulat 16–512.");
        process.exit(1);
    }

    const source = fs.readFileSync(ICON_PATH);
    const { url, bytes } = dataUrlFor(source, size, !process.argv.includes("--keep"));

    if (process.argv.includes("--stdout")) {
        process.stdout.write(url + "\n");
        return;
    }

    const html = fs.readFileSync(TARGET_PATH, "utf8");
    const payload =
        "<!-- Dibuat oleh tools/app-icon.mjs dari icon.png — jangan disunting tangan. -->\n" +
        '<script type="text/plain" id="appIconSource">' + url + "</script>";

    if (process.argv.includes("--check")) {
        if (currentBlock(html) === url) {
            console.log("Ikon sudah sinkron dengan icon.png (" + size + "×" + size + ").");
            return;
        }

        console.error("Ikon di index.html tidak sinkron lagi: jalankan `node tools/app-icon.mjs`.");
        process.exit(1);
    }

    fs.writeFileSync(TARGET_PATH, splice(html, payload));

    console.log(
        "Ikon diperbarui: icon.png → " + size + "×" + size +
        " terang-gelap, " + bytes + " byte PNG, " +
        Math.round(url.length / 1024) + " KB data URL di index.html."
    );
}

main();
