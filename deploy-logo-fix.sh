#!/bin/bash
git add src/app/reports/[groupId]/[partialId]/page.tsx src/app/reports/[groupId]/semester/page.tsx
git commit -m "fix: replace next/image with img tag for logo in reports to ensure visibility"
git push origin main
