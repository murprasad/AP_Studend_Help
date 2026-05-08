#!/usr/bin/env bash
set -e
echo "OPENAI key starts with: ${OPENAI_API_KEY:0:10}..."
for COURSE in AP_CALCULUS_AB AP_CALCULUS_BC AP_PRECALCULUS AP_STATISTICS AP_PHYSICS_1 AP_PHYSICS_2 AP_CHEMISTRY SAT_MATH ACT_MATH; do
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "AUDIT + UNAPPROVE: $COURSE"
  echo "════════════════════════════════════════════════════════════"
  node scripts/llm-audit-formula-mcq.mjs --course=$COURSE --unapprove
done
echo ""
echo "ALL STUDENTNEST MATH+STEM COURSES COMPLETE"
