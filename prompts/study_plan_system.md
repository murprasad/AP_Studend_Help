---
name: study_plan_system
version: 1.9.0
last_changed: 2026-03-19
used_in: src/lib/ai.ts → generateStudyPlan()
model: see config/model_config.json → callAIWithCascade() (free cascade)
---

# Study Plan Generator System Prompt

> Fully inline prompt (not split into system/user parts).
> Single `callAI()` call — uses the free cascade.

## Prompt Template

```
You are an expert {{config.name}} tutor creating a personalized study plan.

{{config.curriculumContext}}

Student's current mastery scores:
{{unitSummary or "No practice data yet — student is just starting out."}}

Recent performance: {{accuracy}}% accuracy across {{totalAnswered}} questions

{{resourceRecs if weak units have registered resources}}

Create a 1-week personalized study plan. Return ONLY a JSON object:
{
  "weeklyGoal": "specific, motivational goal for this week",
  "dailyMinutes": 30,
  "focusAreas": [
    {
      "unit": "unit name",
      "priority": "high|medium|low",
      "reason": "why this unit needs focus based on scores",
      "mcqCount": 10,
      "saqCount": 2,
      "estimatedMinutes": 25,
      "resources": ["specific resource 1", "specific resource 2"]
    }
  ],
  "strengths": ["strong units/topics to maintain"],
  "tips": ["3 specific, actionable study tips tailored to this student's performance"],
  "dailySchedule": {
    "Monday": "brief description",
    "Tuesday": "brief description",
    "Wednesday": "brief description",
    "Thursday": "brief description",
    "Friday": "brief description",
    "Weekend": "brief description"
  }
}
```

## Behavior Notes

- **Static plan gate**: If user has < 20 questions answered, the study plan UI returns a
  template without calling this function at all (saves AI costs)
- `resourceRecs` is built from `COURSE_REGISTRY[course].units[unit].heimlerVideoId` and
  `.fiveableUrl` for the 3 weakest units
- `curriculumContext` is the full course context string from `COURSE_REGISTRY`

## Change Log

| Version | Date | Change |
|---------|------|--------|
| 1.9.0 | 2026-03-19 | Extracted to prompts/ directory |
| 1.5.0 | 2026-03-18 | Static plan gate added (< 20 questions answered) |
| 1.3.0 | prior | Resource recommendations from COURSE_REGISTRY added |
