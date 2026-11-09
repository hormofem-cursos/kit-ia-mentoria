#!/usr/bin/env node
// Manutenção em segundo plano, disparada pelo fim de cada resposta:
// - índice regenerado (se passou mais de 10 minutos desde o último);
// - exame de saúde semanal, gravado em "Saúde do cofre.md";
// - salvamento no GitHub a cada 30 minutos, se o cofre for um repositório.
// Uma manutenção por vez (trava que expira sozinha). Não imprime nada.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ESTADO, COFRE, caminhoSistema, agora } from "./lib.mjs";

const MIN = 60 * 1000;
const marca = (n) => path.join(ESTADO, n);
const idade = (n) => { try { return Date.now() - fs.statSync(marca(n)).mtimeMs; } catch { return Infinity; } };
const marcar = (n) => { fs.mkdirSync(ESTADO, { recursive: true }); fs.writeFileSync(marca(n), agora()); };
const rodar = (arq, ...args) => { try { execFileSync(process.execPath, [caminhoSistema(arq), ...args], { cwd: COFRE, stdio: "ignore", timeout: 120000 }); } catch {} };

try {
  if (idade("manutencao.trava") < 15 * MIN) process.exit(0);
  marcar("manutencao.trava");
  if (idade("indice.ultimo") > 10 * MIN) { rodar("indice.mjs", "--quieto"); marcar("indice.ultimo"); }
  if (idade("saude.ultimo") > 7 * 24 * 60 * MIN) { rodar("saude.mjs", "--gravar"); marcar("saude.ultimo"); }
  if (fs.existsSync(path.join(COFRE, ".git")) && idade("salvar.ultimo") > 30 * MIN) { rodar("salvar.mjs"); marcar("salvar.ultimo"); }
} catch {}
try { fs.rmSync(marca("manutencao.trava"), { force: true }); } catch {}
