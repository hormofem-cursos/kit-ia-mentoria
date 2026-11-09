#!/usr/bin/env node
// Gatilho de fim de resposta (Stop):
// 1. se a sessão teve trabalho de verdade e nada foi registrado no cofre, pede o registro UMA vez;
// 2. dispara a manutenção em segundo plano (índice, exame semanal, salvamento no GitHub).
// A saída é vazia ou um JSON de bloqueio, como o Claude Code espera. Nunca derruba a sessão.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { COFRE, ESTADO, lerEntrada, lerJSON, gravarJSON, evento, caminhoSistema } from "./lib.mjs";

const MIN_FERRAMENTAS = 12, MIN_EDICOES = 2;
const EDITORES = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

function contar(transcript) {
  let ferramentas = 0, edicoes = 0;
  try {
    for (const linha of fs.readFileSync(transcript, "utf8").split("\n")) {
      if (!linha.includes('"tool_use"')) continue;
      let o; try { o = JSON.parse(linha); } catch { continue; }
      for (const c of o?.message?.content || []) if (c?.type === "tool_use") { ferramentas++; if (EDITORES.has(c.name)) edicoes++; }
    }
  } catch {}
  return { ferramentas, edicoes };
}

function cofreMudouDesde(ts) {
  const alvos = ["notas", "diario", "fontes", "pessoal"].map((p) => path.join(COFRE, p)).concat([path.join(COFRE, "Quem sou eu.md")]);
  const andar = (p) => {
    let st; try { st = fs.statSync(p); } catch { return false; }
    if (st.isFile()) return st.mtimeMs > ts;
    for (const f of fs.readdirSync(p)) if (!f.startsWith(".") && andar(path.join(p, f))) return true;
    return false;
  };
  return alvos.some(andar);
}

function manutencao() {
  try {
    const filho = spawn(process.execPath, [caminhoSistema("manutencao.mjs")], { cwd: COFRE, detached: true, stdio: "ignore", windowsHide: true });
    filho.unref();
  } catch {}
}

try {
  const d = await lerEntrada();
  const sid = d.session_id || "sem-id";
  evento("conferir", sid);
  manutencao();
  if (d.stop_hook_active) process.exit(0);
  const est = path.join(ESTADO, "sessoes", `${sid}.json`);
  const s = lerJSON(est, null);
  if (!s) { gravarJSON(est, { inicio: Date.now() }); process.exit(0); } // sessão aberta antes do kit
  if (s.lembrado) process.exit(0);
  const { ferramentas, edicoes } = contar(d.transcript_path || "");
  if (ferramentas < MIN_FERRAMENTAS && edicoes < MIN_EDICOES) process.exit(0);
  if (cofreMudouDesde(s.inicio)) process.exit(0);
  gravarJSON(est, { ...s, lembrado: Date.now() });
  evento("cobrou-registro", sid);
  const reason = `Segundo cérebro: esta sessão teve trabalho de verdade (${ferramentas} ações) e nada foi registrado. Se houve decisão, preferência, erro a evitar ou mudança de estado de projeto, registre agora com a skill segundo-cerebro: atualize ou crie a nota em notas/, rode indice.mjs e anote no diário com registrar.mjs. Se não houve nada durável, diga isso em uma linha e encerre. Este pedido aparece uma vez por sessão.`;
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
} catch (e) {
  process.stderr.write(`Segundo cérebro: conferência indisponível (${e.name}).\n`);
}
