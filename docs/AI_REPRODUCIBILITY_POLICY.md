# AI Reproducibility Policy — StudentNest

**Version:** 1.9.0 | **Updated:** 2026-03-19

This document defines the rules for keeping StudentNest's AI behavior reproducible,
auditable, and maintainable over time. Follow these rules on every PR that touches AI.

---

## What We Track

StudentNest uses AI APIs (Groq, Gemini, etc.) for 5 functions:

| Function | Prompt File | Config |
|----------|-------------|--------|
| `askTutor()` | `prompts/tutor_system.md` | `config/model_config.json → groq` |
| `generateQuestion()` | `prompts/question_generator_system.md` | `config/model_config.json → groq` |
| `generateStudyPlan()` | `prompts/study_plan_system.md` | `config/model_config.json → groq` |
| `validateQuestion()` | `prompts/validator_system.md` | `config/model_config.json → validator` |
| Community moderation | `prompts/community_moderator_system.md` | `config/model_config.json → groq` |

---

## Rules

### 1. Prompt Changes
- Update the relevant file in `prompts/`
- Bump the `version` and `last_changed` fields in the file's frontmatter
- Update the corresponding snapshot in `snapshots/v{version}/` if the output *shape* changes
- Add a row to the Change Log table in the prompt file

### 2. Model Changes
- Update `config/model_config.json` — bump `_version` and `_updated`
- **Never use `"latest"` as a model name** — always pin an explicit version string
- Update the relevant snapshot's `_meta.model` field
- Note in your commit message: `feat: switch validator to X model`

### 3. New AI Function
- Add a prompt file under `prompts/`
- Add a snapshot file under `snapshots/v{version}/`
- Add an entry to the table above
- Add a provider entry to `config/model_config.json` if using a new provider

### 4. Provider Cascade Changes
- Update `cascade_order_free` or `cascade_order_premium` in `config/model_config.json`
- These must match the `PROVIDERS` array order in `src/lib/ai-providers.ts`

### 5. On Deploy
- Run `node scripts/check-cf-compat.js` (already wired into `npm run pages:deploy`)
- Verify `config/model_config.json._version` matches `package.json.version`

---

## What We Deliberately Do NOT Track Here

| Item | Why not |
|------|---------|
| Training data / datasets | We use APIs — no training or fine-tuning |
| Embeddings / RAG pipeline | No embeddings in this project |
| Docker / environment | Deployed to Cloudflare Pages — `wrangler.toml` is the env spec |
| Automated test suite | No Jest/Vitest yet — manual QA plan in `qa_test_plan_beta*.md` |
| Full AI I/O logs | `TutorConversation` table in Neon DB stores all production interactions |

---

## Reproducibility Score Target

| Dimension | Target |
|-----------|--------|
| Prompt traceability | 85%+ (prompts in version-controlled `prompts/`) |
| Model config clarity | 90%+ (all models pinned in `config/model_config.json`) |
| Snapshot baselines | 60%+ (shape validation, not exact text) |
| Documentation | 80%+ (`CLAUDE.md` + `doc/ARCH.md` + this file) |

---

## Quick Reference: What to Update Per Change Type

| Change | Files to update |
|--------|----------------|
| Prompt text | `prompts/*.md` (version + changelog) + `snapshots/v*/` (if shape changes) |
| Model name | `config/model_config.json` + `snapshots/v*/README.md` |
| Temperature | `config/model_config.json` |
| New AI feature | `prompts/` + `snapshots/` + this table |
| Provider priority | `config/model_config.json` + `src/lib/ai-providers.ts` (keep in sync) |
