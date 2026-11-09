#!/usr/bin/env node
// Exame de saúde do cofre: links quebrados, notas sem nenhum link de entrada, tipo fora da
// lista, nota sem resumo em negrito, nota grande demais. Não muda nada nas notas.
// Uso: node saude.mjs [--gravar]   (--gravar escreve o resultado em "Saúde do cofre.md")
import fs from "node:fs";
import path from "node:path";
import { COFRE, listar, TIPOS, hoje } from "./lib.mjs";

const nfc = (s) => s.normalize("NFC").toLowerCase();
const notas = listar(["notas", "fontes", "diario", "pessoal", "raiz"]);
const existentes = new Set(notas.map((n) => nfc(n.nome)).concat(["índice", "indice", "saúde do cofre"].map(nfc)));
const entrada = new Map(notas.map((n) => [nfc(n.nome), 0]));
const quebrados = [], semResumo = [], tipoRuim = [], grandes = [];
for (const n of notas) {
  for (const m of n.corpo.matchAll(/\[\[([^\]|#\n]+)(?:[#|][^\]\n]*)?\]\]/g)) {
    const alvo = nfc(m[1].trim());
    if (!existentes.has(alvo)) quebrados.push(`${n.nome} → [[${m[1].trim()}]]`);
    else if (entrada.has(alvo) && alvo !== nfc(n.nome)) entrada.set(alvo, entrada.get(alvo) + 1);
  }
  if (n.rel.startsWith("notas")) {
    if (!/^\s*\*\*.+\*\*\s*$/m.test(n.corpo.split("\n").find((l) => l.trim()) || "")) semResumo.push(n.nome);
    if (n.tipo && !TIPOS.includes(n.tipo)) tipoRuim.push(`${n.nome} (${n.tipo})`);
    if (!n.tipo) tipoRuim.push(`${n.nome} (sem tipo)`);
    if (n.tamanho > 60000 && !n.tags.includes("historico")) grandes.push(`${n.nome} (${Math.round(n.tamanho / 1000)} KB)`);
  }
}
const orfas = notas.filter((n) => n.rel.startsWith("notas") && !entrada.get(nfc(n.nome))).map((n) => n.nome);
const total = notas.filter((n) => n.rel.startsWith("notas")).length;
const sec = (t, l, dica) => [`## ${t} (${l.length})`, "", ...(l.length ? l.slice(0, 40).map((x) => `- ${x}`) : ["Nada a corrigir."]), ...(l.length && dica ? ["", dica] : []), ""];
const relatorio = ["---", "tipo: mapa", `criado: ${hoje()}`, `atualizado: ${hoje()}`, "tags: [sistema]", "---", "",
  `**Exame de saúde de ${hoje()}: ${total} notas, ${quebrados.length} links quebrados, ${orfas.length} notas sem link de entrada.**`, "", "# Saúde do cofre", "",
  ...sec("Links quebrados", quebrados, "Corrija o nome do link ou crie a nota que falta."),
  ...sec("Notas sem nenhum link de entrada", orfas, "Ligue cada uma a uma nota relacionada ou à nota Quem sou eu."),
  ...sec("Tipo fora da lista", tipoRuim, `Tipos aceitos: ${TIPOS.join(", ")}.`),
  ...sec("Notas sem resumo em negrito no topo", semResumo, "Escreva uma frase em negrito logo depois do frontmatter."),
  ...sec("Notas grandes demais", grandes, "Separe: o estado atual fica na nota; o passado vai para uma nota \"Nome (histórico)\" com a tag historico.")];
if (process.argv.includes("--gravar")) fs.writeFileSync(path.join(COFRE, "Saúde do cofre.md"), relatorio.join("\n"));
else console.log(relatorio.slice(7).join("\n"));
