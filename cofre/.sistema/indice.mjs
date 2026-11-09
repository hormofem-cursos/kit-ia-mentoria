#!/usr/bin/env node
// Regenera o Índice.md a partir das notas: uma linha por nota, agrupada por tipo, com o resumo.
// Uso: node indice.mjs [--quieto]
import fs from "node:fs";
import path from "node:path";
import { COFRE, listar, hoje } from "./lib.mjs";

const ORDEM = ["projeto", "decisao", "preferencia", "armadilha", "padrao", "area", "pessoa", "referencia", "mapa"];
const ROTULO = { projeto: "Projetos", decisao: "Decisões", preferencia: "Preferências", armadilha: "Armadilhas (erros a evitar)", padrao: "Padrões", area: "Áreas", pessoa: "Pessoas", referencia: "Referências", mapa: "Mapas", fonte: "Fontes", "": "Sem tipo" };

const notas = listar(["notas"]);
const fontes = listar(["fontes"]);
const grupos = {};
for (const n of notas) (grupos[n.tipo || ""] ||= []).push(n);
if (fontes.length) grupos.fonte = fontes;
const limpa = (s) => { s = s.replace(/\s+/g, " ").replace(/[*`[\]]/g, "").trim(); return s.length > 140 ? s.slice(0, 137).replace(/\s+\S*$/, "") + "..." : s; };
const out = ["---", "tipo: mapa", "criado: " + hoje(), "atualizado: " + hoje(), "tags: [sistema]", "---", "",
  `**Catálogo do segundo cérebro: ${notas.length} notas e ${fontes.length} fontes. Gerado automaticamente; não edite à mão.**`, "", "# Índice", "",
  "- [[Quem sou eu]] Perfil, projetos e jeito de trabalhar.", "- [[Início]] Como este cofre funciona.", ""];
const chaves = [...ORDEM, ...Object.keys(grupos).filter((k) => !ORDEM.includes(k)).sort()];
for (const k of chaves) {
  if (!grupos[k]) continue;
  out.push(`## ${ROTULO[k] || k} (${grupos[k].length})`, "");
  for (const n of grupos[k].sort((a, b) => a.nome.localeCompare(b.nome, "pt"))) out.push(`- [[${n.nome}]]${n.resumo ? " " + limpa(n.resumo) : ""}`);
  out.push("");
}
const arq = path.join(COFRE, "Índice.md");
const anterior = fs.existsSync(arq) ? fs.readFileSync(arq, "utf8").replace(/^(criado|atualizado): .*$/gm, "") : "";
const novo = out.join("\n");
if (anterior !== novo.replace(/^(criado|atualizado): .*$/gm, "")) fs.writeFileSync(arq, novo);
if (!process.argv.includes("--quieto")) console.log(`Índice atualizado: ${notas.length} notas, ${fontes.length} fontes.`);
