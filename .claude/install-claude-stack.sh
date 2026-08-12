#!/usr/bin/env bash
# Instala e valida o stack "12 coisas para instalar no Claude" neste projeto.
#
#   ./.claude/install-claude-stack.sh            # valida o que ja esta versionado
#   ./.claude/install-claude-stack.sh --heavy    # + instala gstack e hyperframes (pesados)
#   ./.claude/install-claude-stack.sh --update   # + atualiza as skills versionadas na origem
#
# Os itens 1-4 (plugins), 5-7 (skills leves) e 9-12 (MCP) ja vem versionados no
# repositorio: .claude/settings.json, .claude/skills/ e .mcp.json. Este script
# confere se estao ativos e instala sob demanda o que e pesado demais para versionar.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

HEAVY=0
UPDATE=0
for arg in "$@"; do
  case "$arg" in
    --heavy)  HEAVY=1 ;;
    --update) UPDATE=1 ;;
    -h|--help) sed -n '2,12p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "argumento desconhecido: $arg" >&2; exit 2 ;;
  esac
done

FALHAS=0
ok()    { printf '  \033[32mOK\033[0m    %s\n' "$1"; }
falha() { printf '  \033[31mFALHA\033[0m %s\n' "$1"; FALHAS=$((FALHAS + 1)); }
aviso() { printf '  \033[33mAVISO\033[0m %s\n' "$1"; }
titulo(){ printf '\n\033[1m%s\033[0m\n' "$1"; }

tem() { command -v "$1" >/dev/null 2>&1; }

json_tem() { # arquivo, caminho-python
  python3 - "$1" "$2" <<'PY' 2>/dev/null
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(1)
for parte in sys.argv[2].split('.'):
    if not isinstance(d, dict) or parte not in d:
        sys.exit(1)
    d = d[parte]
sys.exit(0)
PY
}

titulo "Pre-requisitos"
tem git    && ok "git $(git --version | awk '{print $3}')"                || falha "git nao encontrado"
tem node   && ok "node $(node --version)"                                 || falha "node nao encontrado (necessario para npx skills)"
tem claude && ok "claude $(claude --version 2>/dev/null | head -1)"       || aviso "CLI claude fora do PATH (a config versionada continua valendo)"
tem bun    && ok "bun $(bun --version)"                                   || aviso "bun ausente - necessario so para o gstack (--heavy)"
tem ffmpeg && ok "ffmpeg presente"                                        || aviso "ffmpeg ausente - necessario so para renderizar com hyperframes"

titulo "1-4. Plugins (.claude/settings.json)"
for m in marketingskills social-media-skills fullstack-dev-skills; do
  json_tem .claude/settings.json "extraKnownMarketplaces.$m" \
    && ok "marketplace $m declarado" || falha "marketplace $m ausente"
done
for p in marketing-skills@marketingskills social-media-skills@social-media-skills fullstack-dev-skills@fullstack-dev-skills; do
  json_tem .claude/settings.json "enabledPlugins.$p" \
    && ok "plugin $p habilitado" || falha "plugin $p ausente"
done

titulo "5-7. Skills versionadas (.claude/skills/)"
for s in frontend-design humanizer create-second-brain-prd; do
  [ -f ".claude/skills/$s/SKILL.md" ] && ok "skill $s" || falha "skill $s ausente"
done

titulo "9-12. Servidores MCP (.mcp.json)"
for s in notion slack zapier higgsfield; do
  json_tem .mcp.json "mcpServers.$s" && ok "mcp $s declarado" || falha "mcp $s ausente"
done
if [ -n "${ZAPIER_MCP_URL:-}" ]; then
  ok "ZAPIER_MCP_URL definida"
else
  aviso "ZAPIER_MCP_URL nao definida - o servidor zapier fica inativo ate exportar a URL do painel mcp.zapier.com"
fi

if [ "$UPDATE" = "1" ]; then
  titulo "Atualizando skills versionadas"
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  if git clone --depth 1 -q https://github.com/anthropics/skills.git "$TMP/anthropic" 2>/dev/null; then
    rm -rf .claude/skills/frontend-design
    cp -r "$TMP/anthropic/skills/frontend-design" .claude/skills/frontend-design
    ok "frontend-design atualizado (anthropics/skills)"
  else
    falha "nao foi possivel clonar anthropics/skills"
  fi
  if git clone --depth 1 -q https://github.com/blader/humanizer.git "$TMP/humanizer" 2>/dev/null; then
    rm -rf .claude/skills/humanizer "$TMP/humanizer/.git" "$TMP/humanizer/.github" "$TMP/humanizer/.claude-plugin"
    cp -r "$TMP/humanizer" .claude/skills/humanizer
    ok "humanizer atualizado (blader/humanizer)"
  else
    falha "nao foi possivel clonar blader/humanizer"
  fi
  if tem node; then
    npx -y skills add coleam00/second-brain-starter >/dev/null 2>&1 \
      && ok "create-second-brain-prd atualizado (coleam00/second-brain-starter)" \
      || falha "npx skills add coleam00/second-brain-starter falhou"
  fi
fi

if [ "$HEAVY" = "1" ]; then
  titulo "3. gstack (instalacao global, ~57 MB)"
  if ! tem bun; then
    falha "gstack exige Bun 1.0+ - instale em https://bun.sh e rode de novo"
  elif [ -d "$HOME/.claude/skills/gstack" ]; then
    ok "gstack ja instalado em ~/.claude/skills/gstack"
  elif git clone --single-branch --depth 1 -q https://github.com/garrytan/gstack.git "$HOME/.claude/skills/gstack"; then
    ( cd "$HOME/.claude/skills/gstack" && ./setup ) && ok "gstack instalado" || falha "gstack: ./setup falhou"
  else
    falha "gstack: clone falhou"
  fi

  titulo "8. hyperframes (instalacao no projeto, ~19 MB / 26 skills)"
  if ! tem node; then
    falha "hyperframes exige Node.js 22+"
  else
    npx -y skills add heygen-com/hyperframes >/dev/null 2>&1 \
      && ok "hyperframes instalado em .agents/skills (ignorado pelo git)" \
      || falha "npx skills add heygen-com/hyperframes falhou"
  fi
else
  titulo "3 e 8. Itens pesados"
  [ -d "$HOME/.claude/skills/gstack" ] && ok "gstack presente" || aviso "gstack nao instalado - rode com --heavy"
  [ -d ".agents/skills/hyperframes" ]  && ok "hyperframes presente" || aviso "hyperframes nao instalado - rode com --heavy"
fi

titulo "Resultado"
if [ "$FALHAS" -eq 0 ]; then
  printf '  \033[32mStack validado sem falhas.\033[0m\n'
  printf '  Rode `claude` e aprove os servidores MCP na primeira execucao (OAuth por /mcp).\n\n'
  exit 0
fi
printf '  \033[31m%d verificacao(oes) falharam.\033[0m\n\n' "$FALHAS"
exit 1
