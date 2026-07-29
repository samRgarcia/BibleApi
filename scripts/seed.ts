/**
 * Seed de la base de datos desde los archivos JSON locales en ./db/
 * (rescatados del historial git del repo original + KJV de dominio público).
 *
 * Uso:
 *   deno run -A scripts/seed.ts            # todas las versiones
 *   deno run -A scripts/seed.ts rv1960     # solo una versión
 *
 * Requiere DATABASE_URL en .env (Neon con sslmode=require).
 * Es reanudable: si una versión ya tiene datos, la salta.
 * Nota: pdt no tiene datos disponibles; su tabla se crea vacía.
 */
import { books } from "$/constants.ts";
import { connect } from "../src/database/index.ts";

const WITH_DATA = ["rv1960", "rv1995", "nvi", "dhh", "kjv"];
const ALL_VERSIONS = [...WITH_DATA, "pdt"];

const args = Deno.args.filter((a) => ALL_VERSIONS.includes(a));
const versions = args.length > 0 ? args : ALL_VERSIONS;

const sql = connect();

type FileVerse = { verse: string; study?: string; number: number };
type FileBook = {
	name: string;
	num_chapters: number;
	chapters: { chapter: string | number; vers: FileVerse[] }[];
};

// ── 1. Esquema base ──────────────────────────────────────────────
console.log("Creando esquema base...");
await sql.unsafe(`create extension if not exists unaccent`);
await sql.unsafe(
	`do $$ begin
		create type testa as enum ('old', 'new');
	exception when duplicate_object then null; end $$;`,
);
await sql.unsafe(`create table if not exists books (
	id serial primary key,
	name text not null,
	testament testa,
	num_chapters integer not null
)`);
await sql.unsafe(`create table if not exists chapters (
	id serial primary key,
	number integer not null,
	book_id integer not null references books(id)
)`);

// ── 2. Libros y capítulos ────────────────────────────────────────
const [{ count: bookCount }] =
	await sql`select count(*)::int as count from books`;
if (bookCount === 0) {
	console.log("Insertando 66 libros y sus capítulos...");
	for (const b of books) {
		const testament = b.testament === "Nuevo Testamento" ? "new" : "old";
		const [row] = await sql`
			insert into books (name, testament, num_chapters)
			values (${b.names[0]}, ${testament}, ${b.chapters})
			returning id`;
		const chapterRows = [];
		for (let n = 1; n <= b.chapters; n++) {
			chapterRows.push({ number: n, book_id: row.id });
		}
		await sql`insert into chapters ${sql(chapterRows, "number", "book_id")}`;
	}
} else {
	console.log(`books ya tiene ${bookCount} registros, saltando.`);
}

// Mapa book -> { chapterNumber -> chapterId }
const chapterMap = new Map<string, Map<number, number>>();
const chapterRows = await sql`
	select chapters.id, chapters.number, books.name
	from chapters join books on chapters.book_id = books.id`;
for (const r of chapterRows) {
	if (!chapterMap.has(r.name)) chapterMap.set(r.name, new Map());
	chapterMap.get(r.name)!.set(r.number, r.id);
}

// ── 3. Versículos por versión ────────────────────────────────────
for (const version of versions) {
	const table = `verses_${version}`;

	await sql.unsafe(`create table if not exists ${table} (
		id serial primary key,
		verse text not null,
		study text,
		number integer not null,
		chapter integer not null,
		chapter_id integer not null references chapters(id)
	)`);

	if (!WITH_DATA.includes(version)) {
		console.log(`${table}: sin datos disponibles, tabla creada vacía.`);
		continue;
	}

	const [{ count }] = await sql.unsafe(
		`select count(*)::int as count from ${table}`,
	);
	if (count > 0) {
		console.log(
			`${table} ya tiene ${count} versículos, saltando. (DROP TABLE ${table} para recargar)`,
		);
		continue;
	}

	console.log(`\n=== Cargando ${version} ===`);
	let total = 0;
	for (const b of books) {
		const bookName = b.names[0];
		const folder = b.testament === "Nuevo Testamento"
			? "newTestament"
			: "oldTestament";
		const path = `./db/${version}/${folder}/${bookName.toLowerCase()}.json`;

		const raw = await Deno.readTextFile(path);
		const data: FileBook = JSON.parse(raw);
		const chapIds = chapterMap.get(bookName)!;

		const rows = [];
		for (const c of data.chapters) {
			const chapterNum = Number(c.chapter);
			const chapterId = chapIds.get(chapterNum);
			if (!chapterId) {
				throw new Error(`Sin chapter_id para ${bookName} ${chapterNum}`);
			}
			for (const v of c.vers) {
				rows.push({
					verse: v.verse,
					study: v.study ?? null,
					number: v.number,
					chapter: chapterNum,
					chapter_id: chapterId,
				});
			}
		}
		await sql`insert into ${sql(table)} ${
			sql(rows, "verse", "study", "number", "chapter", "chapter_id")
		}`;
		total += rows.length;
		console.log(`  ${bookName}: ${rows.length} versículos`);
	}
	console.log(`${version} completa: ${total} versículos.`);
}

console.log("\n¡Listo! Base de datos llena.");
await sql.end();
