#!/usr/bin/env node
// Anota uma entrada no diário de hoje (diario/AAAA-MM-DD.md), criando a nota do dia se faltar.
// Uso: node registrar.mjs "Título" "o que mudou" [--decisao "..."] [--aberto "..."] [--notas "Nota A, Nota B"]
import fs from "node:fs";
import path from "node:path";
import { COFRE, hoje } from "./lib.mjs";

const a = process.argv.slice(2);
const opc = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : ""; };
const livres = a.filter((x, i) => !x.startsWith("--") && !(i > 0 && a[i - 1].startsWith("--")));
const [titulo, mudou] = livres;
if (!titulo) { console.log('Uso: node registrar.mjs "Título" "o que mudou" [--decisao "..."] [--aberto "..."] [--notas "Nota A, Nota B"]'); process.exit(0); }

const dia = hoje();
const arq = path.join(COFRE, "diario", `${dia}.md`);
fs.mkdirSync(path.dirname(arq), { recursive: true });
if (!fs.existsSync(arq)) {
  const [y, m, d] = dia.split("-");
  fs.writeFileSync(arq, `---\ntipo: diario\ncriado: ${dia}\natualizado: ${dia}\ntags: [diario]\n---\n\n**Registro do dia ${d}/${m}/${y}.**\n\n# ${d}/${m}/${y}\n`);
}
const linhas = [`\n## ${titulo}`];
if (mudou) linhas.push(`- O que mudou: ${mudou}`);
if (opc("--decisao")) linhas.push(`- Decisão: ${opc("--decisao")}`);
if (opc("--aberto")) linhas.push(`- Em aberto: ${opc("--aberto")}`);
if (opc("--notas")) linhas.push(`- Notas: ${opc("--notas").split(",").map((n) => `[[${n.trim()}]]`).join(", ")}`);
let txt = fs.readFileSync(arq, "utf8").replace(/^atualizado: .*$/m, `atualizado: ${dia}`);
fs.writeFileSync(arq, txt.trimEnd() + "\n" + linhas.join("\n") + "\n");
console.log(`Anotado em diario/${dia}.md: ${titulo}`);
