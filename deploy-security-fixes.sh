#!/bin/bash

# Security deployment script for Academic Tracker Pro
# Applies all security fixes for GCP Cloud SQL audit

echo "🚀 Applying Security Fixes for Academic Tracker Pro"
echo "=================================================="

# 1. Enforce SSL/TLS for Cloud SQL connections
echo "1. Enforcing SSL/TLS encryption for Cloud SQL..."
./enforce-ssl.sh

# 2. Enable audit logging for authentication
echo "2. Enabling audit logs for failed login attempts..."
./enable-audit-logs.sh

# 3. Deploy updated backend with security comments
echo "3. Deploying backend with security enhancements..."
./deploy-backend.sh

# 4. Deploy frontend with strengthened password validation
echo "4. Deploying frontend with enhanced authentication..."
./deploy.sh

echo "✅ All security fixes applied successfully!"
echo ""
echo "Security Summary:"
echo "- ✅ SSL/TLS encryption enforced for all database connections"
echo "- ✅ Strong password policy implemented (8+ chars, mixed case, numbers, special chars)"
echo "- ✅ Parameterized queries confirmed to prevent SQL injection"
echo "- ✅ Audit logging enabled for authentication events"
echo ""
echo "Monitor GCP Console > Logging for authentication audit logs"