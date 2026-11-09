#!/usr/bin/env node
// Busca no segundo cérebro.
// Uso: node buscar.mjs "termos" [--escopo notas|fontes|diario|pessoal|tudo] [--data AAAA-MM-DD] [--n 8]
import { buscar, ESCOPOS } from "./lib.mjs";

const args = process.argv.slice(2);
const opc = (k, padrao) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : padrao; };
const consulta = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--"))).join(" ");
const escopo = opc("--escopo", "notas");
const escopos = escopo === "tudo" ? [...ESCOPOS, "raiz"] : escopo === "notas" ? ["notas", "raiz"] : [escopo];
const data = opc("--data", null);
const limite = Number(opc("--n", 8));

if (!consulta && !data) {
  console.log('Uso: node buscar.mjs "termos" [--escopo notas|fontes|diario|pessoal|tudo] [--data AAAA-MM-DD]');
  process.exit(0);
}
const res = buscar(consulta, { limite, escopos, data });
if (!res.length) {
  console.log(`Nada encontrado para "${consulta}" em ${escopo}. Tente sinônimos ou --escopo tudo. Busca sem resultado não prova que o assunto não existe.`);
} else {
  for (const { pontos, nota, achados } of res) {
    console.log(`[${String(pontos).padStart(3)}] ${nota.nome}${nota.tipo ? ` (${nota.tipo})` : ""}`);
    if (nota.resumo) console.log(`      ${nota.resumo.slice(0, 170)}`);
    console.log(`      ${nota.rel}${achados.length ? `  · termos: ${achados.join(", ")}` : ""}`);
  }
}
