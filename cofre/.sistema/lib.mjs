// Núcleo do segundo cérebro: leitura das notas e busca. Sem dependências externas.
// Inspirado no LÉO Brain do Dr. Leonardo Jacobsen (busca lexical com pesos, siglas de 3 letras).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SISTEMA = path.dirname(fileURLToPath(import.meta.url));
export const COFRE = path.dirname(SISTEMA);
export const ESTADO = path.join(SISTEMA, "estado");
export const ESCOPOS = ["notas", "fontes", "diario", "pessoal"];
export const TIPOS = ["perfil", "projeto", "decisao", "preferencia", "armadilha", "padrao", "pessoa", "area", "referencia", "fonte", "diario", "mapa", "pessoal"];
// Pasta que nunca entra na busca, mesmo se alguém criar por engano.
const PROIBIDAS = /pacientes?/i;

const PARADAS = new Set(`para pelo pela pelos pelas como onde quando porque muito mais menos esse essa isso este esta isto
aquele aquela aquilo qual quais cada todo toda todos todas sobre entre depois antes ainda tambem apenas outro outra outros
outras nosso nossa seus suas dele dela deles delas voce voces pode posso podemos preciso quero queria fazer faz feito ser
estao sao tem temos ter foi fui era sera vai vamos agora entao assim aqui ali nao sim com sem por dos das nos nas uma uns
umas que meu minha mim tudo nada algum alguma coisa jeito favor arquivo arquivos pasta pastas criar cria crie ele ela mas
seu sua teu tua nem num numa ate via vez ver vou sei the and for are you was not but all can has had her his its one our out who`.split(/\s+/));

export const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
export const norm = (s) => semAcento(String(s || "").toLowerCase());

// Sigla de 3 letras (TRH, SOP, DIU, CFM, VPS) é termo central num cofre médico: entra na busca,
// mas só casa como palavra inteira, senão "sop" casaria "sopa".
export function termos(texto) {
  const out = [];
  for (const t of norm(texto).match(/[a-z0-9][a-z0-9_-]{2,}/g) || []) if (!PARADAS.has(t)) out.push(t);
  return out;
}
const escapa = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function tem(t, txt) { return t.length >= 4 ? txt.includes(t) : new RegExp(`(?<![a-z0-9])${escapa(t)}(?![a-z0-9])`).test(txt); }
function conta(t, txt) { return t.length >= 4 ? txt.split(t).length - 1 : (txt.match(new RegExp(`(?<![a-z0-9])${escapa(t)}(?![a-z0-9])`, "g")) || []).length; }

export function lerNota(arquivo) {
  let bruto;
  try { bruto = fs.readFileSync(arquivo, "utf8"); } catch { return null; }
  let corpo = bruto, tipo = "", tags = [], aliases = [], status = "", atualizado = "";
  if (bruto.startsWith("---")) {
    const fim = bruto.indexOf("\n---", 3);
    if (fim > 0) {
      const fm = bruto.slice(3, fim); corpo = bruto.slice(fim + 4);
      const pega = (k) => (fm.match(new RegExp(`^${k}:\\s*(.+)$`, "m")) || [])[1]?.trim() || "";
      const lista = (k) => ((fm.match(new RegExp(`^${k}:\\s*\\[(.*?)\\]`, "m")) || [])[1] || "").split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      tipo = pega("tipo"); status = pega("status"); atualizado = pega("atualizado"); tags = lista("tags"); aliases = lista("aliases");
    }
  }
  let resumo = "";
  for (const linha of corpo.split("\n")) {
    const l = linha.trim();
    if (!l) continue;
    if (l.startsWith("**") && l.endsWith("**") && l.length > 12) { resumo = l.replace(/^\*+|\*+$/g, "").trim(); break; }
    if (!l.startsWith("#")) { resumo = l; break; }
  }
  return { arquivo, nome: path.basename(arquivo, ".md"), rel: path.relative(COFRE, arquivo), tipo, tags, aliases, status, atualizado, resumo: resumo.slice(0, 200), corpo, tamanho: bruto.length };
}

export function listar(escopos = ["notas"], data = null) {
  const out = [];
  const raiz = escopos.includes("raiz");
  if (raiz) for (const f of ["Quem sou eu.md", "Início.md"]) { const p = lerNota(path.join(COFRE, f)); if (p) out.push(p); }
  for (const e of escopos.filter((x) => x !== "raiz")) {
    const base = path.join(COFRE, e);
    if (!fs.existsSync(base)) continue;
    const andar = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name.startsWith(".") || PROIBIDAS.test(ent.name)) continue;
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) andar(p);
        else if (ent.name.endsWith(".md") && (!data || ent.name === `${data}.md`)) { const n = lerNota(p); if (n) out.push(n); }
      }
    };
    andar(base);
  }
  return out;
}

export function buscar(consulta, { limite = 5, escopos = ["notas", "raiz"], data = null, minimo = null } = {}) {
  const qt = [...new Set(termos(consulta))];
  if (!qt.length && !data) return [];
  const notas = listar(escopos, data);
  if (!qt.length) return notas.slice(0, limite).map((n) => ({ pontos: 1, nota: n, achados: [] }));
  const res = [];
  for (const n of notas) {
    if (["substituido", "arquivado"].includes(n.status)) continue;
    const nome = norm(n.nome + " " + n.aliases.join(" ")), tg = norm(n.tags.join(" ") + " " + n.tipo), rs = norm(n.resumo), corpo = norm(n.corpo);
    let pontos = 0; const achados = [];
    for (const t of qt) {
      let s = 0;
      if (tem(t, nome)) s += 6;
      if (tem(t, tg)) s += 4;
      if (tem(t, rs)) s += 3;
      const c = conta(t, corpo); if (c) s += Math.min(c, 4);
      if (s) { pontos += s; achados.push(t); }
    }
    if (n.tags.map(norm).includes("historico")) pontos = Math.floor(pontos / 2); // histórico fica atrás do estado atual
    if (pontos >= (minimo ?? (qt.length > 2 ? 4 : 1))) res.push({ pontos, nota: n, achados });
  }
  return res.sort((a, b) => b.pontos - a.pontos).slice(0, limite);
}

export function hoje() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
export function agora() { const d = new Date(); return `${hoje()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
export function lerJSON(p, padrao = {}) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return padrao; } }
export function gravarJSON(p, obj) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }
export function evento(nome, extra = "") {
  try { fs.mkdirSync(ESTADO, { recursive: true }); fs.appendFileSync(path.join(ESTADO, "eventos.log"), `${agora()} ${nome} ${extra}\n`); } catch {}
}
export async function lerEntrada() {
  if (process.stdin.isTTY) return {};
  let txt = ""; for await (const c of process.stdin) txt += c;
  try { return JSON.parse(txt || "{}"); } catch { return {}; }
}
export const caminhoSistema = (arq) => path.join(SISTEMA, arq);
