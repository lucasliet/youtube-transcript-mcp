#!/usr/bin/env bash
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
FEATURE_DIR="$REPO_ROOT/specs/$CURRENT_BRANCH"
PLAN_FILE="$FEATURE_DIR/plan.md"
TEMPLATE_DIR="$REPO_ROOT/.specify/templates"
AGENT_TEMPLATE="$TEMPLATE_DIR/agent-file-template.md"

CLAUDE_FILE="$REPO_ROOT/CLAUDE.md"
GEMINI_FILE="$REPO_ROOT/GEMINI.md"
COPILOT_FILE="$REPO_ROOT/.github/copilot-instructions.md"
CURSOR_FILE="$REPO_ROOT/.cursor/rules/specify-rules.mdc"
AGENTS_FILE="$REPO_ROOT/AGENTS.md"

if [ ! -f "$PLAN_FILE" ]; then
  echo "ERROR: No plan.md found at $PLAN_FILE"
  exit 1
fi

echo "=== Updating agent context files for feature $CURRENT_BRANCH ==="

extract_field() {
  local label="$1"
  awk -v lbl="$label" 'match($0, "^\\*\\*" lbl "\\*\\*: ") { print substr($0, RLENGTH + 1); exit }' "$PLAN_FILE"
}

NEW_LANG=$(extract_field "Language/Version" | grep -v "NEEDS CLARIFICATION" || echo "")
NEW_FRAMEWORK=$(extract_field "Primary Dependencies" | grep -v "NEEDS CLARIFICATION" || echo "")
NEW_DB=$(extract_field "Storage" | grep -Ev "^(NEEDS CLARIFICATION|N/A)$" || echo "")
NEW_PROJECT_TYPE=$(extract_field "Project Type" || echo "")
PLAN_SUMMARY=$(awk '/## Summary/{flag=1;next}/^## /{if(flag)exit}flag && NF{gsub(/[`*_]/,"");print;exit}' "$PLAN_FILE")
if [ -z "$PLAN_SUMMARY" ]; then PLAN_SUMMARY="Documentos da feature $CURRENT_BRANCH"; fi

export REPO_ROOT CURRENT_BRANCH NEW_LANG NEW_FRAMEWORK NEW_DB NEW_PROJECT_TYPE PLAN_SUMMARY AGENT_TEMPLATE

update_agent_file() {
  local target_file="$1"
  local agent_name="$2"
  local create_if_missing="$3"
  if [ ! -f "$target_file" ] && [ "$create_if_missing" != "true" ]; then
    echo "Skipping $agent_name context file (not present)"
    return
  fi
  mkdir -p "$(dirname "$target_file")"
  python3 - "$target_file" <<'PY'
import os, sys, pathlib, datetime, re

target_path = pathlib.Path(sys.argv[1])
repo_root = pathlib.Path(os.environ['REPO_ROOT'])
template_path = pathlib.Path(os.environ['AGENT_TEMPLATE'])
branch = os.environ['CURRENT_BRANCH']
lang = os.environ.get('NEW_LANG', '').strip() or 'Tecnologia indefinida'
framework = os.environ.get('NEW_FRAMEWORK', '').strip() or 'Stack base'
db = os.environ.get('NEW_DB', '').strip()
project_type = os.environ.get('NEW_PROJECT_TYPE', '').strip().lower()
summary = os.environ.get('PLAN_SUMMARY', '').strip()
if not summary:
    summary = f'Documentos da feature {branch}'

default_structure = 'src/\ntests/'
if 'web' in project_type:
    default_structure = 'backend/\nfrontend/\ntests/'

commands = '# Adicione comandos relevantes'
lang_lower = lang.lower()
if 'javascript' in lang_lower or 'typescript' in lang_lower:
    commands = 'npm test\nnpm run lint'
elif 'python' in lang_lower:
    commands = 'cd src\npytest\nruff check .'
elif 'rust' in lang_lower:
    commands = 'cargo test\ncargo clippy'

recent_entry = f'- {branch}: Added {lang}'
tech_entry = f'- {lang} + {framework} ({branch})'
if db and db != 'N/A':
    tech_entry += f' [storage: {db}]'

if target_path.exists():
    content = target_path.read_text()
else:
    if not template_path.exists():
        raise SystemExit('Template not found at ' + str(template_path))
    content = template_path.read_text()

content = content.replace('[PROJECT NAME]', repo_root.name)
content = content.replace('[DATE]', datetime.date.today().isoformat())
content = content.replace('[ACTUAL STRUCTURE FROM PLANS]', default_structure)
content = content.replace('[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]', commands)
content = content.replace('[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]', f'{lang}: seguir convenções do projeto')
content = content.replace('[EXTRACTED FROM ALL PLAN.MD FILES]', tech_entry)
content = content.replace('[LAST 3 FEATURES AND WHAT THEY ADDED]', recent_entry)
content = re.sub(r'Last updated: \d{4}-\d{2}-\d{2}', f'Last updated: {datetime.date.today().isoformat()}', content)

sections = {
    'Active Technologies': tech_entry,
    'Recent Changes': recent_entry,
}

for title, entry in sections.items():
    pattern = rf'(## {re.escape(title)}\n)(.*?)(\n## |\Z)'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        continue
    body = match.group(2).strip('\n')
    lines = [line for line in body.split('\n') if line.strip()]
    if entry not in lines:
        lines.insert(0, entry)
    body_text = '\n'.join(lines) + '\n'
    content = content[:match.start(2)] + body_text + content[match.end(2):]

# restore manual additions if present
manual_pattern = r'<!-- MANUAL ADDITIONS START -->.*?<!-- MANUAL ADDITIONS END -->'
manual_match = re.search(manual_pattern, content, re.DOTALL)
manual_block = manual_match.group(0) if manual_match else '<!-- MANUAL ADDITIONS START -->\n<!-- MANUAL ADDITIONS END -->'
content = re.sub(manual_pattern, manual_block, content, flags=re.DOTALL)

target_path.write_text(content)
print(f'✅ {target_path} atualizado')
PY
}

update_agents_doc() {
  [ -f "$AGENTS_FILE" ] || return
  python3 - "$AGENTS_FILE" <<'PY'
import os, sys, re, pathlib
path = pathlib.Path(sys.argv[1])
content = path.read_text()
branch = os.environ.get('CURRENT_BRANCH', '').strip()
summary = os.environ.get('PLAN_SUMMARY', '').strip() or f'Documentos da feature {branch}'
if not branch:
    sys.exit(0)
summary_line = f"- `specs/{branch}/*`: {summary}"
pattern = r'(## Project Structure & Module Organization\n)(.*?)(\n## |\Z)'
match = re.search(pattern, content, re.DOTALL)
if not match:
    sys.exit(0)
section_body = match.group(2).strip('\n')
lines = [line for line in section_body.split('\n') if line.strip()]
if summary_line not in lines:
    lines.append(summary_line)
updated_body = '\n'.join(lines) + '\n'
content = content[:match.start(2)] + updated_body + content[match.end(2):]
path.write_text(content)
print('✅ AGENTS.md atualizado')
sys.exit(0)
pattern = r'(## Project Structure & Module Organization\n)(.*?)(\n## |\Z)'
match = re.search(pattern, content, re.DOTALL)
if not match:
    sys.exit(0)
body = match.group(2).rstrip('\n')
lines = [line for line in body.split('\n') if line]
injected = False
updated_lines = []
for line in lines:
    updated_lines.append(line)
if summary_line not in updated_lines:
    updated_lines.append(summary_line)
updated_body = '\n'.join(updated_lines) + '\n'
content = content[:match.start(2)] + updated_body + content[match.end(2):]
path.write_text(content)
print('✅ AGENTS.md atualizado')
PY
}

AGENT_TYPE="$1"
case "$AGENT_TYPE" in
  claude) update_agent_file "$CLAUDE_FILE" "Claude Code" "true" ;;
  gemini) update_agent_file "$GEMINI_FILE" "Gemini CLI" "true" ;;
  copilot) update_agent_file "$COPILOT_FILE" "GitHub Copilot" "true" ;;
  cursor) update_agent_file "$CURSOR_FILE" "Cursor IDE" "true" ;;
  "")
    [ -f "$CLAUDE_FILE" ] && update_agent_file "$CLAUDE_FILE" "Claude Code"
    [ -f "$GEMINI_FILE" ] && update_agent_file "$GEMINI_FILE" "Gemini CLI"
    [ -f "$COPILOT_FILE" ] && update_agent_file "$COPILOT_FILE" "GitHub Copilot"
    [ -f "$CURSOR_FILE" ] && update_agent_file "$CURSOR_FILE" "Cursor IDE"
    ;;
  *) echo "ERROR: Unknown agent type '$AGENT_TYPE' (expected claude|gemini|copilot|cursor)"; exit 1 ;;
esac

update_agents_doc || true

echo
echo "Summary of changes:"
[ -n "$NEW_LANG" ] && echo "- Added language: $NEW_LANG"
[ -n "$NEW_FRAMEWORK" ] && echo "- Added framework: $NEW_FRAMEWORK"
[ -n "$NEW_DB" ] && [ "$NEW_DB" != "N/A" ] && echo "- Added storage: $NEW_DB"
echo "- Documentos: specs/$CURRENT_BRANCH/*"
echo "Usage: $0 [claude|gemini|copilot|cursor]"
