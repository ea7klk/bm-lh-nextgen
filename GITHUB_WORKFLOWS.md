# GitHub Actions Workflows

This repository includes automated CI/CD workflows using GitHub Actions for building, testing, and publishing Docker images.

## Workflows Overview

### 1. Docker Build and Push (`docker-build.yml`)

**Triggers:**
- Version tags (e.g., `v1.0.0`, `v2.1.3`)
- Manual workflow dispatch

**Features:**
- 🏗️ **Multi-architecture builds**: Builds for `linux/amd64` and `linux/arm64`
- 📦 **GitHub Container Registry**: Publishes to `ghcr.io`
- 🔒 **Security scanning**: Runs Anchore security scan on built images
- ⚡ **Caching**: Uses GitHub Actions cache for faster builds
- 🧪 **Testing**: Optional container testing when manually triggered

**Image Tags:**
- `latest`: Latest release
- `v1.2.3`: Specific version tags
- `1.2`: Major.minor tags
- Branch names for development builds

**Usage:**
```bash
# Pull the latest image
docker pull ghcr.io/ea7klk/bm-lh-nextgen:latest

# Pull a specific version
docker pull ghcr.io/ea7klk/bm-lh-nextgen:v1.0.0
```

### 2. Continuous Integration (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Features:**
- 🔧 **Node.js setup**: Tests with Node.js 20
- 📋 **Dependency check**: Runs `npm ci`
- 🧹 **Linting**: Runs code linting (if configured)
- 🧪 **Testing**: Runs test suite (if configured)
- 🐳 **Docker validation**: Builds and tests Docker container
- 🔐 **Security scan**: Trivy vulnerability scanning on PRs

**Test Flow:**
1. Install dependencies
2. Run linting and tests
3. Build Docker image
4. Start container and test endpoints
5. Security scanning (PRs only)

## Setting Up Releases

### Creating a Release

1. **Tag your release:**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **GitHub will automatically:**
   - Build Docker images for multiple architectures
   - Push to GitHub Container Registry
   - Run security scanning
   - Generate build summary

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- `v1.0.0`: Major release
- `v1.1.0`: Minor release (new features)
- `v1.1.1`: Patch release (bug fixes)

## Docker Registry

Images are published to GitHub Container Registry:

```bash
# Latest version
docker pull ghcr.io/ea7klk/bm-lh-nextgen:latest

# Specific version
docker pull ghcr.io/ea7klk/bm-lh-nextgen:v1.0.0

# Run the container
docker run -p 3000:3000 \
  -e ADMIN_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  ghcr.io/ea7klk/bm-lh-nextgen:latest
```

## Workflow Configuration

### Required Secrets

No additional secrets required! The workflows use:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- Repository permissions for packages (configured in workflow)

### Environment Variables

The workflows test with these default values:
- `ADMIN_PASSWORD=test123`
- `JWT_SECRET=test-secret-for-ci`
- `PORT=3000`

### Customizing Workflows

#### Adding Tests

Update `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint src/"
  }
}
```

#### Adding Dependencies

The workflows will automatically:
- Install new dependencies with `npm ci`
- Cache `node_modules` for faster runs
- Rebuild Docker images with new dependencies

#### Multi-stage Environments

You can create environment-specific workflows:

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]
# ... deployment steps
```

## Security Features

### Container Scanning

- **Anchore Grype**: Scans for vulnerabilities in final image
- **Trivy**: Scans filesystem and dependencies in CI
- **SARIF Upload**: Results integrated with GitHub Security tab

### Build Security

- **Multi-stage builds**: Reduces attack surface
- **Non-root user**: Containers run as unprivileged user
- **Minimal base image**: Alpine Linux for smaller footprint
- **Dependency scanning**: Automated vulnerability detection

## Troubleshooting

### Build Failures

1. **Check workflow logs**: Click on failed workflow run
2. **Local testing**: Run `npm run docker:build` locally
3. **Dependencies**: Ensure `package-lock.json` is committed

### Container Issues

1. **Health check failures**: Verify `/health` endpoint works
2. **Port conflicts**: Ensure test ports are available
3. **Environment variables**: Check required env vars are set

### Registry Access

1. **Permissions**: Ensure repository has package write permissions
2. **Authentication**: GitHub token should have registry access
3. **Visibility**: Check if packages are public/private as intended

## Manual Testing

Test the workflows locally:

```bash
# Test Docker build
npm run docker:build

# Test container
npm run docker:run

# Test with docker-compose
npm run docker:compose
```

## Monitoring

- **Workflow runs**: Check `.github/workflows` tab in repository
- **Security alerts**: Monitor Security tab for vulnerabilities
- **Package registry**: View published images in Packages tab
- **Build status**: README badges show current build status

The workflows provide comprehensive automation for building, testing, and deploying your Brandmeister Lastheard Next Generation application with security and reliability in mind.