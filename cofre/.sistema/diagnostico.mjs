#!/usr/bin/env node
// Diagnóstico para suporte: mostra se os gatilhos estão ligados, quando rodaram pela última vez,
// quantas notas existem e se o cofre está salvo no GitHub. Não muda nada.
// Uso: node diagnostico.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { COFRE, ESTADO, listar } from "./lib.mjs";

const ok = (b) => (b ? "✓" : "✗");
console.log(`Segundo cérebro: ${COFRE}`);
console.log(`Node ${process.version} · ${os.platform()}`);
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".claude", "settings.json"), "utf8")); } catch {}
for (const [ev, arq] of [["SessionStart", "inicio.mjs"], ["UserPromptSubmit", "lembrar.mjs"], ["Stop", "conferir.mjs"]]) {
  const ligado = (cfg.hooks?.[ev] || []).some((g) => (g.hooks || []).some((h) => (h.command || "").includes(arq)));
  console.log(`${ok(ligado)} gatilho ${ev} (${arq})`);
}
const skill = fs.existsSync(path.join(os.homedir(), ".claude", "skills", "segundo-cerebro", "SKILL.md"));
console.log(`${ok(skill)} skill segundo-cerebro instalada`);
const claudeMd = (() => { try { return fs.readFileSync(path.join(os.homedir(), ".claude", "CLAUDE.md"), "utf8").includes("segundo-cerebro:inicio"); } catch { return false; } })();
console.log(`${ok(claudeMd)} regras no CLAUDE.md global`);
const quem = fs.existsSync(path.join(COFRE, "Quem sou eu.md"));
console.log(`${ok(quem)} nota Quem sou eu`);
console.log(`  ${listar(["notas"]).length} notas, ${listar(["fontes"]).length} fontes, ${listar(["diario"]).length} dias no diário`);
try {
  const ev = fs.readFileSync(path.join(ESTADO, "eventos.log"), "utf8").trim().split("\n");
  for (const nome of ["inicio", "lembrar", "conferir"]) {
    const ult = [...ev].reverse().find((l) => l.split(" ")[2] === nome);
    console.log(`  último ${nome}: ${ult ? ult.slice(0, 16) : "nunca"}`);
  }
} catch { console.log("  nenhum gatilho rodou ainda (abra o Claude Code e mande uma mensagem)"); }
try {
  execFileSync("git", ["-C", COFRE, "rev-parse"], { stdio: "ignore" });
  let remoto = ""; try { remoto = execFileSync("git", ["-C", COFRE, "remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch {}
  console.log(`${ok(!!remoto)} repositório git${remoto ? ` ligado a ${remoto}` : " sem GitHub ligado"}`);
  const s = fs.existsSync(path.join(ESTADO, "salvar.log")) ? fs.readFileSync(path.join(ESTADO, "salvar.log"), "utf8").trim().split("\n").pop() : "";
  if (s) console.log(`  último salvamento: ${s}`);
} catch { console.log("✗ ainda não é um repositório git (etapa 6, último passo)"); }
