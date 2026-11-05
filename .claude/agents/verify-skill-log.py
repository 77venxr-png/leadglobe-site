#!/usr/bin/env python3
"""Verify a SKILL-LOG.md: every quote must appear verbatim (whitespace-normalised) in its cited
source under .claude/skills, and every skill listed for the agent must have >= 2 verified quotes.
Usage: verify-skill-log.py <SKILL-LOG.md> <agent-name> [repo-root]"""
import re, sys, pathlib
log, agent = pathlib.Path(sys.argv[1]), sys.argv[2]
root = pathlib.Path(sys.argv[3] if len(sys.argv) > 3 else pathlib.Path(__file__).resolve().parents[2])
norm = lambda t: re.sub(r'\s+', ' ', re.sub(r'[*_`]', '', t)).strip().lower()
fm = (root / '.claude/agents' / f'{agent}.md').read_text().split('---')[1]
skills = re.findall(r'^\s*-\s*([\w-]+)\s*$', fm.split('skills:')[1], re.M)
text, cur, ok, bad = log.read_text(), None, {}, []
lines = text.splitlines()
for i, line in enumerate(lines):
    m = re.match(r'^##\s+([\w-]+)', line)
    if m: cur = m.group(1); continue
    if line.startswith('> ') and cur:
        quote = line[2:]
        src = next((l.split(':', 1)[1].strip() for l in lines[i + 1:i + 4] if l.startswith('source:')), None)
        f = root / src if src else None
        if f and f.is_file() and str(f.resolve()).startswith(str((root / '.claude/skills' / cur).resolve())) and norm(quote) in norm(f.read_text()):
            ok[cur] = ok.get(cur, 0) + 1
        else:
            bad.append(f'[{cur}] NOT FOUND in {src}: {quote[:90]}')
missing = [s for s in skills if ok.get(s, 0) < 2]
print(f'agent={agent} skills={len(skills)} verified_quotes={sum(ok.values())} failed_quotes={len(bad)}')
for b in bad: print('  FAIL', b)
for s in missing: print(f'  MISSING skill {s}: {ok.get(s, 0)} verified quotes (need 2)')
print('RESULT:', 'PASS' if not bad and not missing else 'FAIL')
sys.exit(0 if not bad and not missing else 1)
