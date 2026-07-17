// Cria os buckets públicos de imagens. Uso: node scripts/create-buckets.mjs
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

for (const id of ["avatars", "blog-images", "perfil-audio"]) {
  const { error } = await s.storage.createBucket(id, { public: true });
  if (error && !/already exists/i.test(error.message)) console.error(`✗ ${id}: ${error.message}`);
  else console.log(`✓ bucket ${id} pronto (público)`);
}
