# 🐳 Docker Deployment Guide

This guide covers deploying the Online Tools Collection using Docker for both development and production environments.

## 📋 Prerequisites

- Docker Engine 20.10.0+
- Docker Compose 2.0.0+
- 2GB+ available RAM
- Node.js 18+ (for local development)

## 🚀 Quick Start

### Production Deployment

```bash
# Build and start the production container
npm run docker:compose:prod

# View logs
npm run docker:logs

# Stop the application
npm run docker:compose:down
```

Your application will be available at http://localhost:3000

### Development Deployment

```bash
# Start development environment with hot reloading
npm run docker:compose:dev

# Stop development environment
npm run docker:compose:dev:down
```

## 🏗️ Docker Architecture

### Multi-Stage Production Build

The production Dockerfile uses a 3-stage build process:

1. **Dependencies Stage**: Installs production dependencies
2. **Builder Stage**: Runs linting, tests, and builds the application
3. **Runner Stage**: Creates minimal production image

### Key Features

- ✅ **Security**: Non-root user, read-only filesystem, security options
- ✅ **Performance**: Multi-stage build, optimized layers
- ✅ **Reliability**: Health checks, proper signal handling
- ✅ **Observability**: Structured logging, resource limits
- ✅ **Standards**: Follows Docker best practices

## 📦 Available Scripts

### Building Images

```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev
```

### Running Containers

```bash
# Run production container
npm run docker:run

# Run development container with volume mounting
npm run docker:run:dev
```

### Docker Compose

```bash
# Production with just the app
npm run docker:compose:prod

# Production with Nginx reverse proxy
npm run docker:compose:nginx

# Development environment
npm run docker:compose:dev

# View logs
npm run docker:logs

# Stop services
npm run docker:compose:down
npm run docker:compose:dev:down
```

### Maintenance

```bash
# Clean up unused Docker resources
npm run docker:clean
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | Application port |
| `HOSTNAME` | `0.0.0.0` | Bind hostname |

### Resource Limits

#### Production
- **CPU**: 0.5 cores limit, 0.25 cores reserved
- **Memory**: 512MB limit, 256MB reserved

#### Development
- **Memory**: 1GB limit (no CPU limits)

### Health Checks

- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3 attempts
- **Start Period**: 40 seconds

## 🌐 Production Deployment Options

### Option 1: Standalone Application

```bash
# Simple production deployment
docker-compose up -d
```

- Direct access on port 3000
- Built-in Next.js server
- Suitable for most deployments

### Option 2: With Nginx Reverse Proxy

```bash
# Production with Nginx
docker-compose --profile with-nginx up -d
```

- Nginx on ports 80/443
- Load balancing and caching
- SSL termination ready
- Better for high-traffic sites

### Option 3: Manual Docker Commands

```bash
# Build the image
docker build -t tools-app .

# Run with custom settings
docker run -d \
  --name tools-app \
  -p 3000:3000 \
  --restart unless-stopped \
  --memory=512m \
  --cpus=0.5 \
  tools-app
```

## 🔒 Security Features

### Container Security

- **Non-root user**: Application runs as `nextjs` user (uid 1001)
- **Read-only filesystem**: Container filesystem is read-only
- **No new privileges**: Prevents privilege escalation
- **Minimal base image**: Alpine Linux for smaller attack surface

### Network Security

- **No exposed ports**: Only application port exposed
- **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **HTTPS ready**: Nginx configuration includes SSL settings

### Application Security

- **Code quality**: ESLint and TypeScript checks in build
- **Dependency scanning**: Runs during build process
- **Health monitoring**: Built-in health check endpoint

## 📊 Monitoring and Logging

### Health Checks

The application includes a health check endpoint that:
- Checks if the application responds on the correct port
- Returns appropriate exit codes for Docker
- Includes timeout and retry logic

### Logging

- **Format**: JSON structured logs
- **Rotation**: Max 10MB per file, 3 files retained
- **Access**: Use `docker-compose logs -f` to view

### Resource Monitoring

```bash
# View resource usage
docker stats

# View container details
docker inspect tools-app
```

## 🚀 Deployment Platforms

### Local Development

```bash
# Start development environment
npm run docker:compose:dev
```

### Docker Swarm

```bash
# Deploy to swarm
docker stack deploy -c docker-compose.yml tools-stack
```

### Kubernetes

Convert using Kompose:
```bash
kompose convert -f docker-compose.yml
kubectl apply -f .
```

### Cloud Platforms

#### AWS ECS
- Use the production Docker image
- Configure task definition with resource limits
- Set up Application Load Balancer

#### Google Cloud Run
- Build and push to Container Registry
- Deploy with `gcloud run deploy`
- Automatic scaling included

#### Azure Container Instances
- Use `az container create` with the Docker image
- Configure resource limits and networking

## 🛠️ Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check if port is already in use
lsof -i :3000

# Verify image built correctly
docker images | grep tools-app
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check container limits
docker inspect tools-app | grep -A 10 Resources
```

#### Build Failures
```bash
# Check build context size
du -sh .

# Verify .dockerignore is working
docker build --no-cache .
```

### Debug Mode

```bash
# Run container interactively
docker run -it --entrypoint /bin/sh tools-app

# Exec into running container
docker exec -it tools-app /bin/sh
```

## 📈 Performance Optimization

### Build Optimization
- Multi-stage builds minimize final image size
- .dockerignore reduces build context
- Layer caching optimizes rebuild times

### Runtime Optimization
- Standalone Next.js output for minimal dependencies
- Resource limits prevent resource exhaustion
- Health checks ensure reliability

### Network Optimization
- Nginx gzip compression
- Static file caching
- Connection pooling

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t tools-app .
        
      - name: Run tests
        run: docker run --rm tools-app npm test
        
      - name: Deploy to production
        run: |
          docker tag tools-app your-registry/tools-app:latest
          docker push your-registry/tools-app:latest
```

## 📝 Best Practices

### Development
- Use development Docker setup for consistent environments
- Mount source code for hot reloading
- Use Docker Compose for multi-service development

### Production
- Always use multi-stage builds
- Implement proper health checks
- Set resource limits
- Use specific image tags, not `latest`
- Regularly update base images
- Monitor container metrics

### Security
- Scan images for vulnerabilities
- Use non-root users
- Keep base images updated
- Implement proper logging
- Use secrets management for sensitive data

## 🎯 Next Steps

1. **Set up CI/CD pipeline** for automated builds
2. **Configure monitoring** with Prometheus/Grafana
3. **Implement log aggregation** with ELK stack
4. **Set up backup strategy** for persistent data
5. **Configure SSL certificates** for HTTPS
6. **Implement auto-scaling** based on metrics

Your Next.js application is now ready for production deployment with Docker! 🎉
