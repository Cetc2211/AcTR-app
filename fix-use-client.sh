#!/bin/bash
git add -A
git commit -m "fix: add 'use client' directive to test-ai page component

This resolves the Next.js error: 'You're importing a component that needs useState. 
It only works in a Client Component but none of its parents are marked with use client'"
git push origin main
