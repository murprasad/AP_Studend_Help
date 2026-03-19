# Snapshots — v1.9.0

These files are **golden output baselines** for the 3 core AI functions.

They are NOT production logs. Each file contains:
- The prompt inputs used
- A representative expected output shape
- Notes on what "correct" behavior looks like

## Purpose

When a model, provider, or prompt changes, compare new outputs against these baselines
to catch regressions before deploying. This is a manual process — diff the JSON shapes,
not exact text (AI outputs are non-deterministic).

## Files

| File | AI Function | Prompt File |
|------|-------------|-------------|
| `tutor_sample.json` | `askTutor()` | `prompts/tutor_system.md` |
| `question_sample.json` | `generateQuestion()` | `prompts/question_generator_system.md` |
| `study_plan_sample.json` | `generateStudyPlan()` | `prompts/study_plan_system.md` |

## How to Use

1. Make a change to a prompt, model, or provider config
2. Run the affected AI function manually (or via the dev server)
3. Compare the output shape against the relevant snapshot
4. If the shape diverges unexpectedly → investigate before deploying
5. If the change is intentional → update the snapshot and bump the version

## Version Policy

- Snapshot files stay in sync with the `_version` field in `config/model_config.json`
- On any model name change → update snapshots
- On any prompt structure change → update snapshots
- Snapshot the *shape*, not the verbatim text
