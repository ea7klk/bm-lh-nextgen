# GitHub Actions Troubleshooting Guide

## Common Issues and Solutions

### 1. SARIF Upload Errors

**Error:** `Resource not accessible by integration` and `Invalid SARIF. JSON syntax error`

**Root Cause:** Missing permissions and malformed SARIF output from security scanners.

**✅ Solution Applied:**
- Added `security-events: write` permission to workflows
- Replaced unreliable Anchore scanner with Trivy
- Added `continue-on-error: true` to prevent build failures
- Added file existence checks before upload: `if: hashFiles('trivy-results.sarif') != ''`
- Made security scanning conditional and optional

### 2. Repository Permissions

**Issue:** Workflows need specific permissions to publish packages and upload security results.

**✅ Fixed with:**
```yaml
permissions:
  contents: read        # Read repository content
  packages: write       # Publish to GitHub Container Registry
  security-events: write # Upload SARIF security scan results
  actions: read         # Access to actions metadata
```

### 3. Multi-Architecture Build Issues

**Potential Issue:** ARM64 builds may fail on some dependencies.

**Prevention:**
- Using Node.js 20 Alpine (better ARM64 support)
- Multi-stage builds to isolate build dependencies
- Build tools included in builder stage only

### 4. Container Registry Authentication

**Issue:** Docker login failures or permission denied errors.

**✅ Configured:**
```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

**Note:** `GITHUB_TOKEN` is automatically provided - no manual setup needed.

### 5. Workflow Trigger Issues

**Common Problems:**
- Workflows not running on expected events
- Manual dispatch not working
- Tag-based releases not triggering

**✅ Current Configuration:**
```yaml
# CI: Runs on every push and PR
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

# Docker Build: Runs on version tags and manual trigger
on:
  push:
    tags: [ 'v*.*.*' ]
  workflow_dispatch:
```

### 6. Container Health Check Failures

**Issue:** Tests fail because container isn't ready or endpoints don't respond.

**✅ Solution:**
```bash
# Wait strategy with retries
for i in {1..12}; do
  if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Container is healthy!"
    break
  fi
  echo "⏳ Waiting for container... ($i/12)"
  sleep 5
done
```

### 7. Cache and Build Performance

**Issues:** Slow builds, dependency reinstalls.

**✅ Optimizations Applied:**
- GitHub Actions cache for Docker layers: `cache-from: type=gha`
- Node.js dependency caching: `cache: 'npm'`
- Multi-stage builds to separate build and runtime dependencies
- .dockerignore to exclude unnecessary files

## Quick Fixes for Common Errors

### Error: "workflow_dispatch event not found"
**Fix:** Push the workflow files to the repository first, then manual dispatch will be available.

### Error: "Package not found" when pulling images
**Fix:** 
1. Check if workflow completed successfully
2. Verify repository packages are public
3. Use full image path: `ghcr.io/ea7klk/bm-lh-nextgen:latest`

### Error: "No space left on device" in GitHub Actions
**Fix:** Added cleanup steps in workflows:
```yaml
- name: Cleanup
  if: always()
  run: |
    docker system prune -f
    docker image prune -f
```

### Error: "EACCES: permission denied" in container
**Fix:** Using non-root user in Dockerfile:
```dockerfile
USER nodejs  # UID 1001, non-root execution
```

## Testing Workflows Locally

### Test Docker Build Locally:
```bash
# Build image
npm run docker:build

# Test container
npm run docker:run

# Verify health
curl http://localhost:3000/health
```

### Simulate CI Steps:
```bash
# Install dependencies
npm ci

# Run available tests
npm test

# Build and test Docker
docker build -t test-image .
docker run -d --name test-container -p 3001:3000 \
  -e ADMIN_PASSWORD=test123 test-image
sleep 10
curl http://localhost:3001/health
docker stop test-container && docker rm test-container
```

## Monitoring and Debugging

### Check Workflow Status:
1. Go to repository → Actions tab
2. Click on workflow run to see details
3. Check each step for errors
4. Download logs for detailed debugging

### View Published Images:
1. Go to repository → Packages tab
2. Click on package to see all versions
3. Check package visibility (public/private)
4. View pull statistics

### Security Scan Results:
1. Go to repository → Security tab
2. Click "Code scanning alerts"
3. Review Trivy findings
4. Filter by severity

## Prevention Best Practices

### 1. Always Use `continue-on-error: true` for Optional Steps
```yaml
- name: Optional security scan
  continue-on-error: true
  # ... scan configuration
```

### 2. Add File Existence Checks
```yaml
- name: Upload results
  if: always() && hashFiles('results.sarif') != ''
  # ... upload configuration
```

### 3. Use Specific Action Versions
```yaml
uses: actions/checkout@v4  # Not @main or @latest
```

### 4. Include Cleanup Steps
```yaml
- name: Cleanup
  if: always()  # Runs even if previous steps fail
  run: |
    # Cleanup commands
```

### 5. Test Locally Before Committing
```bash
# Test the exact Docker build that CI will use
docker build -t test .

# Test container startup
docker run --rm -p 3000:3000 -e ADMIN_PASSWORD=test test
```

Your workflows are now configured to handle these common issues gracefully and provide clear feedback when problems occur.