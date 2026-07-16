// Aplica todas as migrations em supabase/migrations/*.sql na ordem.
// Uso: defina DATABASE_URL no .env.local (connection string do Postgres do
// Supabase — Project Settings → Database → Connection string → URI) e rode:
//   npm run db:push
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "\n✗ DATABASE_URL ausente no .env.local.\n" +
      "  Pegue em: Supabase → Project Settings → Database → Connection string (URI).\n" +
      "  Ex.: postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres\n"
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    process.stdout.write(`→ aplicando ${file} ... `);
    await client.query(sql);
    console.log("ok");
  }
  console.log("\n✓ Migrations aplicadas com sucesso.");
} catch (err) {
  console.error("\n✗ Falha ao aplicar migration:\n", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
