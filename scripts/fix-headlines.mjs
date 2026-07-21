import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const strip = (t) => (t || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Monta uma headline legível: frase completa se couber, senão corta na última palavra. */
function makeHeadline(source) {
  const t = strip(source);
  if (!t) return null;
  if (t.length <= 150) return t;                     // já cabe inteiro
  const janela = t.slice(0, 170);
  const fim = Math.max(janela.lastIndexOf(". "), janela.lastIndexOf("! "), janela.lastIndexOf("? "));
  if (fim >= 60) return t.slice(0, fim + 1).trim();  // termina numa frase
  const corte = t.slice(0, 140);
  return corte.slice(0, corte.lastIndexOf(" ")).trim() + "…";
}

const { data, error } = await s.from("psychologists").select("id,display_name,headline,bio");
if (error) { console.error("ERRO:", error.message); process.exit(1); }

const alvo = (data ?? []).filter(y => {
  const h = (y.headline || "").trim();
  return h.length >= 138 && !/[.!?…]$/.test(h);
});
console.log(`headlines truncadas encontradas: ${alvo.length}`);

let ok = 0, pulados = 0;
for (const y of alvo) {
  const nova = makeHeadline(y.bio && strip(y.bio).length > strip(y.headline).length ? y.bio : y.headline);
  if (!nova || nova === y.headline) { pulados++; continue; }
  const r = await s.from("psychologists").update({ headline: nova }).eq("id", y.id);
  if (r.error) { console.log(`  falhou ${y.display_name}: ${r.error.message}`); continue; }
  if (ok < 5) console.log(`  · ${y.display_name}\n      antes: ...${(y.headline||"").slice(-45)}\n      depois: ...${nova.slice(-45)}`);
  ok++;
}
console.log(`\n✓ corrigidas: ${ok} | puladas: ${pulados}`);

// Despublica a conta demo (segue disponível para teste)
const ana = await s.from("psychologists").update({ is_published: false }).eq("slug","dra-ana-exemplo-616c37");
console.log(ana.error ? "erro ao despublicar Ana: "+ana.error.message : "✓ Dra. Ana despublicada (fora do catálogo público)");
