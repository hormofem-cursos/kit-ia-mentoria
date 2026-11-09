#!/usr/bin/env node
// Salva o cofre no GitHub: commit do que mudou, pull com rebase, push. Nunca força nada.
// Se houver conflito, desfaz o rebase, não envia e anota em .sistema/estado/salvar.log.
// Uso: node salvar.mjs ["mensagem"]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { COFRE, ESTADO, agora } from "./lib.mjs";

const log = (m) => { fs.mkdirSync(ESTADO, { recursive: true }); fs.appendFileSync(path.join(ESTADO, "salvar.log"), `${agora()} ${m}\n`); };
const git = (...a) => execFileSync("git", ["-C", COFRE, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 90000 });

try {
  git("rev-parse", "--is-inside-work-tree");
} catch { log("pulado: o cofre não é um repositório git"); process.exit(0); }
if (fs.existsSync(path.join(COFRE, ".git", "rebase-merge")) || fs.existsSync(path.join(COFRE, ".git", "MERGE_HEAD"))) {
  log("parado: há um conflito pendente; peça ao Claude Code para resolver"); process.exit(0);
}
try {
  const mudados = git("status", "--porcelain").split("\n").filter((l) => l.trim());
  if (mudados.length) {
    git("add", "-A");
    git("commit", "-q", "-m", process.argv[2] || `auto: ${agora()}, ${mudados.length} ${mudados.length === 1 ? "arquivo" : "arquivos"}`);
  }
  let temRemoto = true;
  try { git("remote", "get-url", "origin"); } catch { temRemoto = false; }
  if (!temRemoto) { log(`commit local (${mudados.length}); sem repositório no GitHub ligado`); process.exit(0); }
  try { git("pull", "--rebase", "-q"); }
  catch (e) { try { git("rebase", "--abort"); } catch {} log("parado: conflito ao trazer do GitHub; nada foi enviado"); process.exit(0); }
  git("push", "-q");
  log(`salvo no GitHub (${mudados.length} ${mudados.length === 1 ? "arquivo" : "arquivos"})`);
  if (process.stdout.isTTY) console.log("Segundo cérebro salvo no GitHub.");
} catch (e) {
  log(`erro: ${String(e.stderr || e.message).trim().slice(0, 200)}`);
}
