# Stack do Claude Code neste projeto

Implantação do guia **"12 coisas para instalar no Claude"** (plugins, skills e
servidores MCP). Quem clona o repositório já recebe a configuração pronta — não
há passo manual para os itens versionados.

```bash
./.claude/install-claude-stack.sh           # valida a implantação
./.claude/install-claude-stack.sh --heavy   # + instala gstack e hyperframes
./.claude/install-claude-stack.sh --update  # + atualiza as skills versionadas
```

## O que está versionado

| # | Item | Tipo | Onde vive | Estado |
|---|------|------|-----------|--------|
| 1 | marketing-skills | Plugin | `.claude/settings.json` | versionado |
| 2 | social-media-skills | Plugin | `.claude/settings.json` | versionado |
| 3 | gstack | Plugin | `~/.claude/skills/gstack` | sob demanda (`--heavy`) |
| 4 | fullstack-dev-skills | Plugin | `.claude/settings.json` | versionado |
| 5 | frontend-design | Skill | `.claude/skills/frontend-design` | versionado |
| 6 | humanizer | Skill | `.claude/skills/humanizer` | versionado |
| 7 | ai-second-brain | Skill | `.claude/skills/create-second-brain-prd` | versionado |
| 8 | hyperframes | Skill | `.agents/skills/` | sob demanda (`--heavy`) |
| 9 | Notion | MCP | `.mcp.json` | versionado (OAuth no 1º uso) |
| 10 | Slack | MCP | `.mcp.json` | versionado (OAuth no 1º uso) |
| 11 | Zapier | MCP | `.mcp.json` | versionado (exige `ZAPIER_MCP_URL`) |
| 12 | Higgsfield | MCP | `.mcp.json` | versionado (login no 1º uso) |

## Por que 3 e 8 não estão versionados

`gstack` ocupa ~57 MB e exige Bun; `hyperframes` instala 26 skills (~19 MB) de
produção de vídeo. Versionar os dois em todo repositório encheria o contexto de
cada sessão com skills que quase nunca são usadas aqui, além de inchar o clone.
Ficam a um comando de distância (`--heavy`) e o `.gitignore` já impede que a
instalação local suje o repositório.

Para tornar o hyperframes permanente neste projeto, basta instalar e versionar:

```bash
npx skills add heygen-com/hyperframes
git add -f .agents skills-lock.json && git commit -m "vendoriza hyperframes"
```

## Servidores MCP

Os quatro servidores são declarados em `.mcp.json` (escopo de projeto). Na
primeira execução o Claude Code pede aprovação e o OAuth é aberto por `/mcp`.

O Zapier é o único que exige configuração por pessoa, porque a URL do servidor
carrega um token individual. Pegue a URL no painel `mcp.zapier.com` (Connect →
Claude) e exporte:

```bash
export ZAPIER_MCP_URL="https://mcp.zapier.com/api/mcp/s/SEU_TOKEN/mcp"
```

Sem essa variável o Claude Code apenas avisa que o servidor `zapier` está
inativo — os outros três seguem funcionando.

## Origem das skills versionadas

| Skill | Origem | Commit |
|-------|--------|--------|
| frontend-design | `anthropics/skills` → `skills/frontend-design` | `f17010c` |
| humanizer | `blader/humanizer` | `523374d` |
| create-second-brain-prd | `coleam00/second-brain-starter` (via `npx skills add`) | `74f7544` |

Atualize com `./.claude/install-claude-stack.sh --update`.

## Observação sobre os plugins

O guia original manda instalar `fullstack-dev-skills@jeffallan`, mas o
`marketplace.json` do repositório `jeffallan/claude-skills` se declara com o
nome `fullstack-dev-skills`. O identificador correto — e o que está versionado
aqui — é `fullstack-dev-skills@fullstack-dev-skills`.

O item 5 do guia aponta `frontend-design@claude-plugins-official`, marketplace
que não responde por esse nome. A skill oficial foi obtida direto do repositório
`anthropics/skills`, que é a fonte dela.
