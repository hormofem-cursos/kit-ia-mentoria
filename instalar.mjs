#!/usr/bin/env node
// Instalador do kit de IA da Mentoria HORMOFEM.
// Faz quatro coisas, sem apagar nada que já exista:
//   1. copia as skills do kit para ~/.claude/skills
//   2. monta o segundo cérebro em ~/segundo-cerebro (só cria o que falta)
//   3. acrescenta as regras do segundo cérebro ao CLAUDE.md global (~/.claude/CLAUDE.md)
//   4. liga o lembrete de início de sessão (~/.claude/settings.json)
// Pode rodar de novo quando o kit for atualizado: ele só acrescenta e atualiza o que é dele.
// Uso: node instalar.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.dirname(fileURLToPath(import.meta.url));
const HOME = os.homedir();
const CLAUDE = path.join(HOME, ".claude");
const COFRE = path.join(HOME, "segundo-cerebro");
const agora = new Date();
const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`; // data local, não UTC
const feito = [];

function garantirPasta(p) { fs.mkdirSync(p, { recursive: true }); }
function copiarPasta(origem, destino) {
  garantirPasta(destino);
  for (const nome of fs.readdirSync(origem)) {
    const o = path.join(origem, nome), d = path.join(destino, nome);
    if (fs.statSync(o).isDirectory()) copiarPasta(o, d); else fs.copyFileSync(o, d);
  }
}

// 1. Skills
const pastaSkills = path.join(KIT, "skills");
for (const skill of fs.readdirSync(pastaSkills)) {
  const o = path.join(pastaSkills, skill);
  if (!fs.statSync(o).isDirectory()) continue;
  copiarPasta(o, path.join(CLAUDE, "skills", skill));
  feito.push(`Skill ${skill} instalada em ${path.join(CLAUDE, "skills", skill)}`);
}

// 2. Segundo cérebro
const modelos = path.join(pastaSkills, "segundo-cerebro", "modelos");
for (const p of ["00-entrada", "01-projetos", "02-areas", "03-referencias", "04-arquivo", "diario"]) garantirPasta(path.join(COFRE, p));
const notas = [["LEIA-ME.md", "LEIA-ME.md"], ["Índice.md", "Índice.md"], ["Quem sou eu.md", path.join("02-areas", "Quem sou eu.md")]];
for (const [modelo, destino] of notas) {
  const d = path.join(COFRE, destino);
  if (fs.existsSync(d)) continue;
  fs.writeFileSync(d, fs.readFileSync(path.join(modelos, modelo), "utf8").replaceAll("{{DATA}}", hoje));
  feito.push(`Nota criada: ${destino}`);
}
const diario = path.join(COFRE, "diario", `${hoje}.md`);
if (!fs.existsSync(diario)) {
  fs.writeFileSync(diario, `---\ntipo: diario\ncriado: ${hoje}\natualizado: ${hoje}\ntags: [diario]\n---\n\n**Registro do dia ${hoje}.**\n\n# ${hoje}\n\n## Segundo cérebro montado\n- O que mudou: cofre criado pelo kit da Mentoria HORMOFEM.\n- Em aberto: preencher a nota [[Quem sou eu]].\n`);
  feito.push(`Diário de hoje criado`);
}

// 3. Regras no CLAUDE.md global (bloco marcado, substituído a cada instalação)
garantirPasta(CLAUDE);
const INICIO = "<!-- segundo-cerebro:inicio -->", FIM = "<!-- segundo-cerebro:fim -->";
const bloco = `${INICIO}
## Segundo cérebro (kit da Mentoria HORMOFEM)

O meu segundo cérebro fica em ${COFRE} e é aberto no Obsidian. Use a skill segundo-cerebro.

- Antes de qualquer tarefa nova, leia 02-areas/Quem sou eu.md e procure no cofre o que já existe sobre o assunto.
- Depois de uma entrega com substância, registre sem eu pedir: atualize a nota do assunto (ou crie uma), o Índice.md e a nota do dia em diario/.
- Nunca grave no cofre dado que identifique paciente, nem senha, token ou chave.
- Responda sempre em português do Brasil.
- Meus projetos ficam em ${path.join(HOME, "claude-code")}, um por pasta.
${FIM}`;
const arqClaude = path.join(CLAUDE, "CLAUDE.md");
let texto = fs.existsSync(arqClaude) ? fs.readFileSync(arqClaude, "utf8") : "";
if (texto.includes(INICIO) && texto.includes(FIM)) {
  texto = texto.slice(0, texto.indexOf(INICIO)) + bloco + texto.slice(texto.indexOf(FIM) + FIM.length);
  feito.push("Regras do segundo cérebro atualizadas no CLAUDE.md global");
} else {
  texto = (texto.trim() ? texto.trimEnd() + "\n\n" : "") + bloco + "\n";
  feito.push("Regras do segundo cérebro acrescentadas ao CLAUDE.md global");
}
fs.writeFileSync(arqClaude, texto);

// 4. Lembrete de início de sessão (hook SessionStart), sem mexer no resto do settings.json
const lembrete = path.join(COFRE, ".lembrete.txt");
fs.writeFileSync(lembrete, `Segundo cérebro em ${COFRE}. Antes de agir, leia Quem sou eu e procure no cofre o que já existe sobre a tarefa. Depois de entregar, registre (nota do assunto, Índice e diário). Use a skill segundo-cerebro.\n`);
const arqConfig = path.join(CLAUDE, "settings.json");
let config = {};
if (fs.existsSync(arqConfig)) {
  try { config = JSON.parse(fs.readFileSync(arqConfig, "utf8")); }
  catch { console.error(`\nNão consegui ler ${arqConfig} (o arquivo tem um erro). Nada foi mudado nele. Peça ao Claude Code para corrigir e rode de novo.`); process.exit(1); }
  fs.copyFileSync(arqConfig, arqConfig + ".antes-do-kit");
}
const comando = process.platform === "win32" ? `type "${lembrete}"` : `cat "${lembrete}"`;
config.hooks = config.hooks || {};
const lista = config.hooks.SessionStart = config.hooks.SessionStart || [];
const jaTem = lista.some((g) => (g.hooks || []).some((h) => (h.command || "").includes(".lembrete.txt")));
if (!jaTem) {
  lista.push({ hooks: [{ type: "command", command: comando }] });
  feito.push("Lembrete de início de sessão ligado");
}
fs.writeFileSync(arqConfig, JSON.stringify(config, null, 2) + "\n");

console.log("\nKit da Mentoria HORMOFEM instalado.\n");
for (const f of feito) console.log("  ✓ " + f);
console.log(`\nPróximo passo: abra o Obsidian, escolha "Abrir pasta como cofre" e selecione ${COFRE}.\nDepois preencha a nota "Quem sou eu".\n`);
