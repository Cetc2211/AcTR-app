#!/bin/bash
git add -A
git commit -m "fix: remove invalid export from API route

- Removed testCloudRunConnection export from src/app/api/test-ai/route.ts
- Route handlers should only export HTTP methods (GET, POST, etc.)
- This resolves: 'testCloudRunConnection is not a valid Route export field'"
git push origin main
