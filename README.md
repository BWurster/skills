# Skills

Personal [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills). Each top-level folder is one self-contained skill: a `SKILL.md` plus any scripts and references it needs.

| Skill | What it does | Extra setup |
|---|---|---|
| [`quiz-me-docs`](quiz-me-docs/) | Quizzes you on your own code block by block and writes your answers in as comments | None |
| [`study-pack`](study-pack/) | Builds a deep, from-zero PowerPoint deck plus a companion study-guide PDF on any topic, researched from firsthand sources | See [study-pack requirements](#study-pack-requirements) |

## Installing a single skill

Claude Code loads skills from `~/.claude/skills/<name>/` (available in every project) or `<project>/.claude/skills/<name>/` (that project only). Installing a skill means putting its folder in one of those places. Each option below installs **one** skill; swap `study-pack` for the skill you want.

### Option 1: clone once, symlink what you want (recommended)

You get updates with `git pull`, and you only enable the skills you link.

```bash
git clone git@github.com:BWurster/skills.git ~/Projects/skills
mkdir -p ~/.claude/skills
ln -s ~/Projects/skills/study-pack ~/.claude/skills/study-pack
```

To update later: `git -C ~/Projects/skills pull`. To uninstall: `rm ~/.claude/skills/study-pack` (this removes only the link).

### Option 2: download only one skill's folder

A sparse checkout fetches just the folder you name:

```bash
git clone --filter=blob:none --sparse git@github.com:BWurster/skills.git /tmp/skills
git -C /tmp/skills sparse-checkout set study-pack
cp -R /tmp/skills/study-pack ~/.claude/skills/
rm -rf /tmp/skills
```

### Option 3: install for one project only

Put the skill under the project's `.claude/skills/` directory, using a copy or a symlink:

```bash
mkdir -p .claude/skills
ln -s ~/Projects/skills/study-pack .claude/skills/study-pack
```

### Check it worked

Start a new Claude Code session and type `/` and the skill's name (e.g. `/study-pack`). It should autocomplete. Claude also invokes skills on its own when a request matches the skill's description.

## study-pack requirements

`study-pack` runs local scripts, so it needs:

- **Node.js** 18+. Run this once after installing: `cd ~/.claude/skills/study-pack/scripts/deck && npm install` (installs `pptxgenjs` and `jszip`).
- **Python 3** with **Pillow** (`pip install pillow`), used for slide contact sheets.
- **Google Chrome**, Chromium or Edge, used to print the guide PDF. Set `CHROME=/path/to/browser` if it isn't in a standard location.
- **poppler** (`brew install poppler`) for `pdftoppm`, `pdftotext` and `pdfinfo`.
- *Optional:* Microsoft PowerPoint (macOS) or LibreOffice, for rendering slides during visual QA. Without either, QA falls back to the builder's text-fit warnings.

Packs are created in the directory you run Claude Code from, as one folder per topic:

```
<topic>/
  pack.config.json   theme, title, callout labels
  research/          sources, quotes, outline
  deck/  guide/      editable slide and guide sources
  build/             intermediate artifacts (renders, code checks)
  out/               <Topic>-Deck.pptx, <Topic>-Study-Guide.pdf
```

## Adding a skill to this repo

1. Create `<skill-name>/SKILL.md` with `name` and `description` frontmatter.
2. Add a row to the table above, with any extra setup it needs.
3. Symlink it into `~/.claude/skills/` to use it while developing.
