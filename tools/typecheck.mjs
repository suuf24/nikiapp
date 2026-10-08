/**
 * Pemeriksa tipe untuk skrip inline di index.html — tanpa dependensi proyek.
 *
 * Aplikasi ini tetap satu berkas HTML tanpa `package.json` dan tanpa langkah
 * build (lihat .freebuff/run.md). Karena itu TypeScript di sini hanya berlaku
 * sebagai PEMERIKSA, bukan bagian dari perakitan: skripnya disalin ke berkas
 * sementara di luar proyek, `tsc` dijalankan atas salinan itu, dan `index.html`
 * sendiri tidak pernah diubah oleh alat ini.
 *
 * Pemakaian:
 *   node tools/typecheck.mjs              # ekstrak lalu periksa
 *   node tools/typecheck.mjs --keep       # sisakan berkas sementara, cetak jalurnya
 *   node tools/typecheck.mjs --emit-config  # hanya tulis tsconfig.json lalu berhenti
 *
 * `tsc` diambil lewat `npx -y -p typescript@5`, jadi TIDAK ada yang dipasang ke
 * proyek: tidak ada node_modules, tidak ada package.json, tidak ada lockfile.
 * Yang dibutuhkan hanya Node.js dan jaringan pada pemanggilan pertama (hasilnya
 * di-cache oleh npx).
 *
 * Kode keluar: 0 bila bersih, 1 bila ada galat tipe, 2 bila ekstraksi gagal.
 * Galat tipe dilaporkan apa adanya dengan jumlahnya — tidak ada penyaring yang
 * menyembunyikan galat agar tampak lolos.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTML = join(ROOT, "index.html");
const OUT = process.env.TYPECHECK_OUT || join(tmpdir(), "niki-typecheck");

const argv = process.argv.slice(2);
const keep = argv.includes("--keep");
const emitConfigOnly = argv.includes("--emit-config");

/* =========================================================
   EKSTRAKSI
========================================================= */

/*
 * Hanya <script> yang benar-benar dieksekusi peramban yang diperiksa. Tag
 * ber-`type="text/plain"` di berkas ini menyimpan DATA, bukan kode (template
 * prompt AI dan sumber ikon base64), jadi memeriksanya sebagai JavaScript cuma
 * akan melahirkan galat palsu.
 */
function isExecutableScript(attributes) {
    if (!/type\s*=/.test(attributes)) {
        return true;
    }

    const match = /type\s*=\s*"([^"]*)"/.exec(attributes);

    if (!match) {
        return true;
    }

    const type = match[1].trim().toLowerCase();

    return (
        type === "text/javascript" ||
        type === "module" ||
        type === "application/javascript" ||
        type === "text/ecmascript" ||
        type === "application/ecmascript"
    );
}

function extractScripts(html) {
    const scripts = [];
    const openTag = /<script([^>]*)>/gi;
    let match;

    while ((match = openTag.exec(html)) !== null) {
        if (!isExecutableScript(match[1])) {
            continue;
        }

        const start = openTag.lastIndex;
        const close = html.indexOf("</script>", start);

        if (close === -1) {
            throw new Error("tag </script> tidak ditemukan setelah " + match[0]);
        }

        scripts.push({
            /* Nomor baris awal isi skrip, supaya galat tsc bisa dipetakan balik. */
            offset: html.slice(0, start).split("\n").length,
            code: html.slice(start, close)
        });
    }

    return scripts;
}

/*
 * tsc melaporkan posisi relatif terhadap berkas sementara, sedangkan yang
 * berguna bagi pembaca adalah baris di index.html. Setiap galat karena itu
 * diberi baris asalnya, dengan `--offset` sebagai rujukan.
 */
function annotate(output, scripts) {
    return output
        .split("\n")
        .map((line) => {
            const match = /^(script-\d+\.js)\((\d+),(\d+)\)/.exec(line);

            if (!match) {
                return line;
            }

            const script = scripts[Number(match[1].replace(/\D/g, "")) - 1];

            if (!script) {
                return line;
            }

            const htmlLine = script.offset + Number(match[2]) - 1;

            return line + "   [index.html:" + htmlLine + "]";
        })
        .join("\n");
}

/* =========================================================
   JALAN
========================================================= */

if (!existsSync(HTML)) {
    console.error("Tidak menemukan " + HTML);
    process.exit(2);
}

let scripts;

try {
    scripts = extractScripts(readFileSync(HTML, "utf8"));
} catch (error) {
    console.error("Ekstraksi gagal: " + error.message);
    process.exit(2);
}

if (!scripts.length) {
    console.error("Tidak ada skrip yang bisa dieksekusi di index.html.");
    process.exit(2);
}

mkdirSync(OUT, { recursive: true });

/* Bersihkan sisa pemeriksaan sebelumnya supaya tidak ada berkas yatim. */
for (const entry of readdirSync(OUT)) {
    if (entry.startsWith("script-") || entry === "tsconfig.json") {
        rmSync(join(OUT, entry), { force: true });
    }
}

const files = scripts.map((script, index) => {
    const name = "script-" + (index + 1) + ".js";
    writeFileSync(join(OUT, name), script.code, "utf8");
    return name;
});

/*
 * Dua tingkat:
 *  - `strict` penuh untuk memeriksa tipe secara sungguh-sungguh;
 *  - `noImplicitAny: false` untuk TAHAP AWAL, karena skrip ini belum
 *    beranotasi. Tujuannya menangkap ketidaksesuaian tipe yang nyata lebih
 *    dulu, bukan membanjiri laporan dengan "implicitly has an 'any' type".
 *    Naikkan ke `--strict` setelah anotasinya lengkap.
 */
const tsconfig = {
    compilerOptions: {
        noEmit: true,
        allowJs: true,
        checkJs: true,
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        moduleDetection: "force",
        skipLibCheck: true,
        strict: true,
        noImplicitAny: false,
        types: []
    },
    files
};

writeFileSync(join(OUT, "tsconfig.json"), JSON.stringify(tsconfig, null, 4) + "\n", "utf8");

console.log("Skrip tereksekusi: " + scripts.length + " (baris awal: " + scripts.map((s) => s.offset).join(", ") + ")");
console.log("Berkas sementara: " + OUT);

if (emitConfigOnly) {
    process.exit(0);
}

/*
 * Perintah dirakit sebagai satu string dan dijalankan lewat shell. Dua sebab:
 *  - di Windows, `npx` itu `npx.cmd`, dan Node menolak men-spawn berkas .cmd
 *    tanpa shell (EINVAL) sejak Node 18.20;
 *  - bentuk string menghindari DEP0190 (memasrahkan larik argumen ke shell).
 * Tidak ada bagian perintah ini yang berasal dari masukan pengguna, jadi tidak
 * ada yang perlu dikutip.
 */
const result = spawnSync("npx -y -p typescript@5 tsc -p tsconfig.json", {
    cwd: OUT,
    shell: true,
    encoding: "utf8"
});

if (result.error) {
    console.error("Gagal menjalankan tsc: " + result.error.message);
    console.error("Butuh Node.js dan jaringan pada pemanggilan pertama (tsc diambil lewat npx).");
    process.exit(2);
}

const output = annotate((result.stdout || "") + (result.stderr || ""), scripts).trim();

if (result.status === 0) {
    console.log("Tipe bersih: tidak ada galat.");
} else {
    const errors = (output.match(/\berror TS\d+/g) || []).length;
    console.log("--- galat tipe (" + errors + ") ---");
    console.log(output);
    console.log("--- ringkas: " + errors + " galat ---");
}

if (!keep) {
    for (const file of files) {
        rmSync(join(OUT, file), { force: true });
    }
}

process.exit(result.status === 0 ? 0 : 1);
