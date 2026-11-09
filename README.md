# Kit de IA da Mentoria HORMOFEM

O kit que os mentorados instalam na trilha de Inteligência Artificial da plataforma da
Mentoria HORMOFEM. Ele monta o **segundo cérebro** e ensina o Claude Code a usá-lo.

## O que tem aqui

| Arquivo ou pasta | O que é |
|---|---|
| `skills/segundo-cerebro/` | A skill com o método: consultar antes, registrar depois, tipos de nota, faxina, salvamento |
| `cofre/` | O modelo do segundo cérebro: notas Início e Quem sou eu, modelos de nota, configuração do Obsidian e os scripts de `.sistema/` (busca, memória automática, cobrança de registro, índice, exame de saúde, salvamento no GitHub, diagnóstico) |
| `instalar.mjs` | O instalador. Roda com Node.js 18 ou mais novo e não apaga nada que já exista |

## O que o instalador faz

1. Copia as skills para `~/.claude/skills/`.
2. Cria o segundo cérebro em `~/segundo-cerebro`: `Quem sou eu.md`, `Início.md`, `Índice.md`,
   as pastas `notas/`, `diario/`, `fontes/`, `pessoal/` e `modelos/`, o Obsidian configurado
   (marcadores, cores por tipo no grafo, diário e modelos) e os scripts em `.sistema/`.
3. Acrescenta ao `~/.claude/CLAUDE.md` global um bloco com as regras do segundo cérebro
   (marcado, para poder ser atualizado sem duplicar).
4. Liga três gatilhos no `~/.claude/settings.json` (guarda antes uma cópia em
   `settings.json.antes-do-kit`): no início da sessão (lembrete e últimos registros), a cada
   pedido (as notas relacionadas vão junto) e no fim (pede o registro uma vez, se faltou, e roda
   a manutenção: índice, exame semanal e salvamento no GitHub a cada 30 minutos). Também libera
   os comandos e a pasta do cofre para o Claude ler, escrever e buscar sem pedir licença a cada vez.

Inspirado no LÉO Brain, o segundo cérebro do Dr. Leonardo Jacobsen.

Pode rodar de novo quando o kit for atualizado: ele só acrescenta e atualiza o que é dele.

## Como instalar (para o Claude Code seguir)

Requisitos: Git e Node.js instalados.

1. Baixe o repositório para a pasta `claude-code` do usuário:

   ```
   cd ~/claude-code
   git clone https://github.com/hormofem-cursos/kit-ia-mentoria
   ```

2. Rode o instalador:

   ```
   node ~/claude-code/kit-ia-mentoria/instalar.mjs
   ```

3. Diga ao usuário para abrir o Obsidian, escolher "Abrir pasta como cofre" e selecionar a
   pasta `segundo-cerebro`.
4. Ofereça montar a nota `Quem sou eu.md`: peça numa mensagem só o que ele já tem (Instagram,
   site do consultório, Lattes, LinkedIn, Doctoralia, currículo em PDF) e siga a seção 5 da
   skill `segundo-cerebro`. Não faça questionário.

## Como atualizar

```
cd ~/claude-code/kit-ia-mentoria
git pull
node instalar.mjs
```

## Regra que não muda

Nenhum dado que identifique paciente, nenhuma senha e nenhuma chave entram no segundo cérebro.
