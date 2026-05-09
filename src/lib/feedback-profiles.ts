/**
 * src/lib/feedback-profiles.ts
 *
 * Static accessor for user-feedback profiles (StudentNest set: AP/SAT/ACT).
 *
 * We can't rely on fs.readFileSync(process.cwd() + "/data/...") at
 * runtime on CF Workers — the bundler doesn't ship those JSON files
 * into the worker bundle. Instead we use static JSON imports.
 *
 * To add a new course's profile, drop the JSON in
 * data/user-feedback-profiles/<COURSE>.json then add a static import here.
 */

import actEnglish from "../../data/user-feedback-profiles/ACT_ENGLISH.json";
import actMath from "../../data/user-feedback-profiles/ACT_MATH.json";
import actReading from "../../data/user-feedback-profiles/ACT_READING.json";
import actScience from "../../data/user-feedback-profiles/ACT_SCIENCE.json";
import apBio from "../../data/user-feedback-profiles/AP_BIOLOGY.json";
import apPhys1 from "../../data/user-feedback-profiles/AP_PHYSICS_1.json";
import satMath from "../../data/user-feedback-profiles/SAT_MATH.json";
import satRw from "../../data/user-feedback-profiles/SAT_READING_WRITING.json";

interface PopupTip {
  tip_id: string;
  text: string;
  source_attribution: string;
}

interface Profile {
  schema_version: string;
  course: string;
  generator_prompt_injection?: string;
  popup_tips?: PopupTip[];
  calibration?: {
    coverage_strategy?: string;
    topic_weights?: Record<string, number>;
    [key: string]: unknown;
  };
}

const PROFILES: Record<string, Profile> = {
  ACT_ENGLISH: actEnglish as Profile,
  ACT_MATH: actMath as Profile,
  ACT_READING: actReading as Profile,
  ACT_SCIENCE: actScience as Profile,
  AP_BIOLOGY: apBio as Profile,
  AP_PHYSICS_1: apPhys1 as Profile,
  SAT_MATH: satMath as Profile,
  SAT_READING_WRITING: satRw as Profile,
};

export function getFeedbackProfile(course: string): Profile | null {
  return PROFILES[course] ?? null;
}

export function getAllPopupTips(): PopupTip[] {
  const all: PopupTip[] = [];
  for (const profile of Object.values(PROFILES)) {
    for (const t of profile.popup_tips ?? []) all.push(t);
  }
  return all;
}
