// Copies the vetted skills (.claude/skills) to .agents/skills for tools that auto-discover skills
// there (e.g. Codex). Cross-platform (no symlinks). The copy is git-ignored; .claude/skills is canonical.
// Usage: node studio/sync-skills.mjs
import { cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, '.claude', 'skills');
const dst = join(root, '.agents', 'skills');
if (!existsSync(src)) { console.error('missing .claude/skills'); process.exit(1); }
rmSync(dst, { recursive: true, force: true });
cpSync(src, dst, { recursive: true });
console.log(`synced ${src} -> ${dst}`);
