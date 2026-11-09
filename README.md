# Kit de IA da Mentoria HORMOFEM

O kit que os mentorados instalam na trilha de Inteligência Artificial da plataforma da
Mentoria HORMOFEM. Ele monta o **segundo cérebro** e ensina o Claude Code a usá-lo.

## O que tem aqui

| Arquivo ou pasta | O que é |
|---|---|
| `skills/segundo-cerebro/` | A skill que ensina o Claude Code a consultar o segundo cérebro antes de cada tarefa e a registrar nele o que foi decidido depois. Traz os modelos das notas iniciais |
| `instalar.mjs` | O instalador. Roda com Node.js e não apaga nada que já exista |

## O que o instalador faz

1. Copia as skills para `~/.claude/skills/`.
2. Cria o segundo cérebro em `~/segundo-cerebro`, com as pastas `00-entrada`, `01-projetos`,
   `02-areas`, `03-referencias`, `04-arquivo` e `diario`, mais as notas `LEIA-ME`, `Índice` e
   `Quem sou eu`.
3. Acrescenta ao `~/.claude/CLAUDE.md` global um bloco com as regras do segundo cérebro
   (marcado, para poder ser atualizado sem duplicar).
4. Liga um lembrete de início de sessão no `~/.claude/settings.json` (guarda antes uma cópia
   em `settings.json.antes-do-kit`).

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
   pasta `segundo-cerebro`, e depois preencher a nota `02-areas/Quem sou eu.md`.

## Como atualizar

```
cd ~/claude-code/kit-ia-mentoria
git pull
node instalar.mjs
```

## Regra que não muda

Nenhum dado que identifique paciente, nenhuma senha e nenhuma chave entram no segundo cérebro.
