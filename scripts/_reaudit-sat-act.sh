#!/bin/bash
cd /c/Users/akkil/project/AP_Help
for c in SAT_MATH SAT_READING_WRITING ACT_ENGLISH ACT_MATH ACT_READING ACT_SCIENCE; do
  echo "── re-auditing $c ──"
  node scripts/_sample-coverage-audit.mjs --course=$c
  sleep 5
done
