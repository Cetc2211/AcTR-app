#!/bin/bash
git add src/hooks/use-data.tsx
git commit -m "fix(risk): adjust risk calculation tolerance for early partial stages"
git push origin main
./setup-api-secret.sh