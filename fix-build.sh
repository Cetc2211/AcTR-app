#!/bin/bash
# Script para hacer commit de las correcciones del build

git add -A
git commit -m "fix: correct API route types and imports for testing page

- Changed src/app/api/test-ai/route.ts from Server Action to proper Route Handler (GET export)
- Added explicit 'any' types to filter functions to resolve TypeScript errors
- Updated src/app/debug/test-ai/page.tsx to call /api/test-ai endpoint instead of importing server action

This resolves the Vercel build error: 'testCloudRunConnection' is not a valid Route export field"

git push origin main
