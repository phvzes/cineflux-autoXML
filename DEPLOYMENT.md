# CineFlux-AutoXML Deployment Guide

```
 ██████╗██╗███╗   ██╗███████╗███████╗██╗     ██╗   ██╗██╗  ██╗
██╔════╝██║████╗  ██║██╔════╝██╔════╝██║     ██║   ██║╚██╗██╔╝
██║     ██║██╔██╗ ██║█████╗  █████╗  ██║     ██║   ██║ ╚███╔╝ 
██║     ██║██║╚██╗██║██╔══╝  ██╔══╝  ██║     ██║   ██║ ██╔██╗ 
╚██████╗██║██║ ╚████║███████╗██║     ███████╗╚██████╔╝██╔╝ ██╗
 ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝
                                                              
 █████╗ ██╗   ██╗████████╗ ██████╗ ██╗  ██╗███╗   ███╗██╗     
██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗╚██╗██╔╝████╗ ████║██║     
███████║██║   ██║   ██║   ██║   ██║ ╚███╔╝ ██╔████╔██║██║     
██╔══██║██║   ██║   ██║   ██║   ██║ ██╔██╗ ██║╚██╔╝██║██║     
██║  ██║╚██████╔╝   ██║   ╚██████╔╝██╔╝ ██╗██║ ╚═╝ ██║███████╗
╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
```

## Table of Contents

- [Introduction](#introduction)
- [Deployment Options Overview](#deployment-options-overview)
- [Detailed Deployment Instructions](#detailed-deployment-instructions)
  - [Netlify Deployment](#netlify-deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [GitHub Pages Deployment](#github-pages-deployment)
  - [Self-hosted Deployment](#self-hosted-deployment)
- [Environment Variable Configuration](#environment-variable-configuration)
  - [Required Environment Variables](#required-environment-variables)
  - [Optional Environment Variables](#optional-environment-variables)
  - [Environment-Specific Configurations](#environment-specific-configurations)
- [Security Configuration Recommendations](#security-configuration-recommendations)
  - [CORS Headers for SharedArrayBuffer](#cors-headers-for-sharedarraybuffer)
  - [Content Security Policy (CSP)](#content-security-policy-csp)
  - [Additional Security Best Practices](#additional-security-best-practices)
- [Docker Deployment Options](#docker-deployment-options)
  - [Docker Compose Setup](#docker-compose-setup)
  - [Docker Image Customization](#docker-image-customization)
  - [Container Orchestration](#container-orchestration)
- [Performance Monitoring Setup](#performance-monitoring-setup)
  - [Recommended Monitoring Tools](#recommended-monitoring-tools)
  - [Key Metrics to Track](#key-metrics-to-track)
  - [Performance Optimization Strategies](#performance-optimization-strategies)
- [Troubleshooting](#troubleshooting)
  - [Common Deployment Issues](#common-deployment-issues)
  - [Environment-Specific Issues](#environment-specific-issues)
- [Appendix](#appendix)
  - [Deployment Checklist](#deployment-checklist)
  - [Additional Resources](#additional-resources)

## Introduction

This deployment guide provides comprehensive instructions for deploying CineFlux-AutoXML in various environments. CineFlux-AutoXML is a browser-based application that automatically creates music videos by synchronizing video clips with music tracks using advanced audio analysis and visual content recognition.

The application uses client-side processing with WebAssembly (FFmpeg.wasm, OpenCV.js) and Web Audio API, which requires specific security headers and configurations for optimal performance and functionality.

## Deployment Options Overview

CineFlux-AutoXML can be deployed in several ways:

1. **Static Hosting Platforms**:
   - **Netlify**: Recommended for ease of use and built-in header configuration
   - **Vercel**: Excellent for React applications with good header support
   - **GitHub Pages**: Requires additional configuration for security headers

2. **Self-hosted Options**:
   - **Docker**: Containerized deployment for consistent environments
   - **Traditional Web Server**: Apache, Nginx, or other web servers
   - **Cloud Providers**: AWS S3 + CloudFront, Google Cloud Storage, Azure Static Web Apps

3. **Development Environment**:
   - **Local Development**: Using Node.js and npm/pnpm
   - **Docker Development**: Using Docker Compose

## Detailed Deployment Instructions

### Netlify Deployment

Netlify is the recommended platform for deploying CineFlux-AutoXML due to its excellent support for single-page applications and easy configuration of security headers.

#### Prerequisites

- GitHub, GitLab, or Bitbucket repository with your CineFlux-AutoXML code
- Netlify account (free tier available)

#### Deployment Steps

1. **Build the Application**:
   ```bash
   npm run build:prod
   ```

2. **Configure Netlify Settings**:
   - Create a `netlify.toml` file in the root of your project (already included in the repository)
   - Ensure it contains the necessary build settings and headers:

   ```toml
   [build]
     command = "npm run build:prod"
     publish = "dist"

   [build.environment]
     NODE_VERSION = "18"
     NPM_FLAGS = "--no-audit --production=false"

   # Production context
   [context.production]
     command = "npm run build:prod"
     environment = { NODE_ENV = "production" }

   # Headers for the entire site
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Permissions-Policy = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
       Cross-Origin-Embedder-Policy = "require-corp"
       Cross-Origin-Opener-Policy = "same-origin"
       Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' blob:; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; frame-ancestors 'none';"

   # Special headers for WebAssembly files
   [[headers]]
     for = "/assets/wasm/*.wasm"
     [headers.values]
       Content-Type = "application/wasm"
       Cache-Control = "public, max-age=31536000, immutable"
       Cross-Origin-Embedder-Policy = "require-corp"
       Cross-Origin-Opener-Policy = "same-origin"
   ```

3. **Deploy to Netlify**:
   - Option 1: Connect to Git repository
     - Log in to Netlify
     - Click "New site from Git"
     - Select your repository
     - Configure build settings (should be auto-detected from netlify.toml)
     - Click "Deploy site"

   - Option 2: Manual deploy
     - Run `npm run build:prod` locally
     - Drag and drop the `dist` folder to Netlify's manual deploy area

4. **Verify Deployment**:
   - Check that the site is accessible
   - Verify security headers are correctly set using browser developer tools
   - Test WebAssembly functionality

#### Custom Domain Configuration (Optional)

1. In the Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow the instructions to configure DNS settings
4. Enable HTTPS (Netlify provides free SSL certificates)

### Vercel Deployment

Vercel is another excellent platform for deploying React applications with good support for security headers.

#### Prerequisites

- GitHub, GitLab, or Bitbucket repository with your CineFlux-AutoXML code
- Vercel account (free tier available)

#### Deployment Steps

1. **Configure Vercel Settings**:
   - Create a `vercel.json` file in the root of your project:

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "buildCommand": "npm run build:prod",
           "outputDirectory": "dist"
         }
       }
     ],
     "routes": [
       { "handle": "filesystem" },
       { "src": "/(.*)", "dest": "/index.html" }
     ],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-Content-Type-Options", "value": "nosniff" },
           { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
           { "key": "Permissions-Policy", "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" },
           { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
           { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
           { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' blob:; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; frame-ancestors 'none';" }
         ]
       },
       {
         "source": "/assets/wasm/(.*).wasm",
         "headers": [
           { "key": "Content-Type", "value": "application/wasm" },
           { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
           { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
           { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
         ]
       }
     ]
   }
   ```

2. **Deploy to Vercel**:
   - Option 1: Using Vercel CLI
     ```bash
     npm install -g vercel
     vercel login
     vercel
     ```

   - Option 2: Connect to Git repository
     - Log in to Vercel
     - Click "New Project"
     - Import your repository
     - Configure project settings
     - Click "Deploy"

3. **Verify Deployment**:
   - Check that the site is accessible
   - Verify security headers are correctly set
   - Test WebAssembly functionality

#### Environment Variables in Vercel

To set environment variables in Vercel:
1. Go to your project settings
2. Navigate to the "Environment Variables" tab
3. Add your environment variables (see [Environment Variable Configuration](#environment-variable-configuration))

### GitHub Pages Deployment

GitHub Pages is a free hosting option, but it has limitations regarding security headers. Additional configuration is required for full functionality.

#### Prerequisites

- GitHub repository with your CineFlux-AutoXML code
- GitHub Pages enabled for the repository

#### Deployment Steps

1. **Configure GitHub Pages**:
   - Go to repository settings
   - Scroll down to "GitHub Pages" section
   - Select the branch to deploy (usually `main` or `gh-pages`)
   - Select the folder (usually `/` or `/docs`)

2. **Modify Build Configuration**:
   - Update `vite.config.js` to include the correct base path:

   ```javascript
   export default defineConfig({
     base: '/your-repo-name/',
     // other configuration
   });
   ```

3. **Create Deployment Workflow**:
   - Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'

         - name: Install Dependencies
           run: npm ci

         - name: Build
           run: npm run build:prod

         - name: Deploy
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             folder: dist
             branch: gh-pages
   ```

4. **Security Headers Workaround**:
   - GitHub Pages does not support custom headers directly
   - Consider using a service worker to add headers:

   ```javascript
   // In public/sw.js
   self.addEventListener('install', (event) => {
     self.skipWaiting();
   });

   self.addEventListener('activate', (event) => {
     event.waitUntil(clients.claim());
   });

   self.addEventListener('fetch', (event) => {
     const response = fetch(event.request)
       .then((response) => {
         const newHeaders = new Headers(response.headers);
         newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
         newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

         return new Response(response.body, {
           status: response.status,
           statusText: response.statusText,
           headers: newHeaders,
         });
       });

     event.respondWith(response);
   });
   ```

   - Register the service worker in your application:

   ```javascript
   // In src/main.jsx or similar
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
       navigator.serviceWorker.register('/your-repo-name/sw.js');
     });
   }
   ```

5. **Alternative: Use a Custom Domain with Cloudflare**:
   - Set up a custom domain for your GitHub Pages site
   - Use Cloudflare as the DNS provider
   - Configure Cloudflare Page Rules to add the required headers

> **Note**: The service worker approach for adding headers is a workaround and may not work in all browsers or scenarios. For production use, consider using Netlify, Vercel, or a custom domain with Cloudflare.

### Self-hosted Deployment

#### Option 1: Traditional Web Server (Nginx)

1. **Build the Application**:
   ```bash
   npm run build:prod
   ```

2. **Configure Nginx**:
   - Create an Nginx configuration file:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/cineflux-autoxml/dist;
       index index.html;

       # CORS headers for WebAssembly support
       add_header Cross-Origin-Embedder-Policy require-corp;
       add_header Cross-Origin-Opener-Policy same-origin;
       
       # Security headers
       add_header X-Content-Type-Options nosniff;
       add_header X-Frame-Options SAMEORIGIN;
       add_header X-XSS-Protection "1; mode=block";
       
       # Handle Single Page Application routing
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
           access_log off;
       }
       
       # WebAssembly files
       location ~* \.(wasm)$ {
           default_type application/wasm;
           expires off;
           add_header Cache-Control "public, max-age=0, must-revalidate";
       }

       # Enable gzip compression
       gzip on;
       gzip_comp_level 6;
       gzip_min_length 256;
       gzip_types
           application/javascript
           application/json
           application/wasm
           application/xml
           font/eot
           font/otf
           font/ttf
           image/svg+xml
           text/css
           text/javascript
           text/plain
           text/xml;
       gzip_vary on;
   }
   ```

3. **Deploy to Server**:
   - Copy the `dist` directory to your server
   - Place the Nginx configuration in `/etc/nginx/sites-available/`
   - Create a symbolic link to `/etc/nginx/sites-enabled/`
   - Test the configuration: `nginx -t`
   - Reload Nginx: `systemctl reload nginx`

4. **Set Up SSL (Recommended)**:
   - Install Certbot: `apt install certbot python3-certbot-nginx`
   - Obtain SSL certificate: `certbot --nginx -d your-domain.com`
   - Certbot will automatically update your Nginx configuration

#### Option 2: AWS S3 + CloudFront

1. **Create an S3 Bucket**:
   - Log in to AWS Management Console
   - Navigate to S3 and create a new bucket
   - Configure the bucket for static website hosting

2. **Upload Files**:
   - Build the application: `npm run build:prod`
   - Upload the contents of the `dist` directory to the S3 bucket

3. **Create a CloudFront Distribution**:
   - Navigate to CloudFront in AWS Management Console
   - Create a new distribution
   - Set the S3 bucket as the origin
   - Configure cache behavior

4. **Configure Security Headers**:
   - Create a CloudFront Function or Lambda@Edge function to add headers
   - Example CloudFront Function:

   ```javascript
   function handler(event) {
       var response = event.response;
       var headers = response.headers;
       
       // Add security headers
       headers['cross-origin-embedder-policy'] = { value: 'require-corp' };
       headers['cross-origin-opener-policy'] = { value: 'same-origin' };
       headers['x-content-type-options'] = { value: 'nosniff' };
       headers['x-frame-options'] = { value: 'SAMEORIGIN' };
       headers['x-xss-protection'] = { value: '1; mode=block' };
       
       return response;
   }
   ```

5. **Set Up Custom Domain (Optional)**:
   - Configure Route 53 or your DNS provider
   - Set up SSL certificate using AWS Certificate Manager

## Environment Variable Configuration

CineFlux-AutoXML uses environment variables for configuration. These can be set in `.env` files, Docker Compose files, or through your deployment platform's interface.

### Required Environment Variables

| Variable | Description | Default Value | Example |
|----------|-------------|---------------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `VITE_APP_VERSION` | Application version | `0.1.0` | `0.1.0` |

### Optional Environment Variables

| Variable | Description | Default Value | Example |
|----------|-------------|---------------|---------|
| `VITE_WASM_CDN_URL` | CDN URL for WebAssembly files | Empty (local files) | `https://cdn.example.com/wasm` |
| `VITE_FEATURE_FLAGS` | JSON string of feature flags | `{"debugMode":false,"experimentalFeatures":false,"advancedAnalysis":true}` | `{"debugMode":true,"experimentalFeatures":true,"advancedAnalysis":true}` |

### Environment-Specific Configurations

#### Development Environment

```dotenv
# .env.development
NODE_ENV=development
VITE_APP_VERSION=0.1.0
VITE_WASM_CDN_URL=
VITE_FEATURE_FLAGS={"debugMode":true,"experimentalFeatures":true,"advancedAnalysis":true}
```

#### Staging Environment

```dotenv
# .env.staging
NODE_ENV=production
VITE_APP_VERSION=0.1.0
VITE_WASM_CDN_URL=
VITE_FEATURE_FLAGS={"debugMode":true,"experimentalFeatures":false,"advancedAnalysis":true}
```

#### Production Environment

```dotenv
# .env.production
NODE_ENV=production
VITE_APP_VERSION=0.1.0
VITE_WASM_CDN_URL=
VITE_FEATURE_FLAGS={"debugMode":false,"experimentalFeatures":false,"advancedAnalysis":true}
```

## Security Configuration Recommendations

### CORS Headers for SharedArrayBuffer

CineFlux-AutoXML uses WebAssembly with SharedArrayBuffer for high-performance processing. This requires specific CORS headers to be set:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These headers must be set on all HTML responses to enable cross-origin isolation, which is required for SharedArrayBuffer to work.

#### Header Configuration by Platform

| Platform | Configuration Method | Example |
|----------|----------------------|---------|
| Netlify | `netlify.toml` | See [Netlify Deployment](#netlify-deployment) |
| Vercel | `vercel.json` | See [Vercel Deployment](#vercel-deployment) |
| GitHub Pages | Service Worker (workaround) | See [GitHub Pages Deployment](#github-pages-deployment) |
| Nginx | Server configuration | See [Self-hosted Deployment](#self-hosted-deployment) |
| Apache | `.htaccess` | `Header set Cross-Origin-Embedder-Policy "require-corp"` |
| AWS CloudFront | CloudFront Functions | See [Self-hosted Deployment](#self-hosted-deployment) |

### Content Security Policy (CSP)

A Content Security Policy helps prevent cross-site scripting (XSS) and other code injection attacks. The following CSP is recommended for CineFlux-AutoXML:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' blob:; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; frame-ancestors 'none';
```

This policy:
- Allows scripts, workers, and connections from the same origin and blob URLs
- Allows images from the same origin, blob URLs, and data URLs
- Allows styles from the same origin and inline styles
- Allows fonts from the same origin
- Blocks object embeds
- Prevents the site from being framed

> **Note**: `unsafe-eval` and `unsafe-inline` are required for the application to function properly due to the use of WebAssembly and dynamic script evaluation. In a production environment, consider using nonces or hashes for script and style elements if possible.

### Additional Security Best Practices

1. **HTTP Strict Transport Security (HSTS)**:
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   ```

2. **X-Content-Type-Options**:
   ```
   X-Content-Type-Options: nosniff
   ```

3. **X-Frame-Options**:
   ```
   X-Frame-Options: DENY
   ```

4. **Referrer Policy**:
   ```
   Referrer-Policy: strict-origin-when-cross-origin
   ```

5. **Permissions Policy**:
   ```
   Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
   ```

6. **Subresource Integrity (SRI)**:
   - For external scripts and stylesheets, use integrity attributes:
   ```html
   <script src="https://example.com/script.js" 
           integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC" 
           crossorigin="anonymous"></script>
   ```

## Docker Deployment Options

### Docker Compose Setup

CineFlux-AutoXML includes Docker Compose configurations for both development and production environments.

#### Development Environment

```yaml
# docker-compose.yml (development section)
services:
  app-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: cineflux-autoxml-dev
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_APP_VERSION=0.1.0
      - VITE_WASM_CDN_URL=
      - VITE_FEATURE_FLAGS={"debugMode":true,"experimentalFeatures":true,"advancedAnalysis":true}
    command: >
      sh -c "npm run dev -- --host 0.0.0.0"
```

To start the development environment:

```bash
docker-compose up app-dev
```

#### Production Environment

```yaml
# docker-compose.yml (production section)
services:
  app-prod:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cineflux-autoxml-prod
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - VITE_APP_VERSION=0.1.0
      - VITE_WASM_CDN_URL=
      - VITE_FEATURE_FLAGS={"debugMode":false,"experimentalFeatures":false,"advancedAnalysis":true}
    restart: unless-stopped
```

To start the production environment:

```bash
docker-compose up app-prod
```

### Docker Image Customization

The Docker image can be customized for specific deployment needs:

#### Custom Build Arguments

```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg APP_VERSION=1.0.0 \
  -t cineflux-autoxml:custom .
```

#### Custom Nginx Configuration

1. Create a custom Nginx configuration file
2. Mount it in the Docker Compose file:

```yaml
services:
  app-prod:
    # ... other configuration
    volumes:
      - ./custom-nginx.conf:/etc/nginx/conf.d/default.conf
```

#### Multi-stage Build Optimization

The default Dockerfile uses a multi-stage build to minimize image size:

```dockerfile
# Stage 1: Build the React + Vite app
FROM node:20-alpine AS build
# ... build steps

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
# ... configuration steps
```

You can customize this process by modifying the Dockerfile.

### Container Orchestration

For larger deployments, consider using container orchestration:

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cineflux-autoxml
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cineflux-autoxml
  template:
    metadata:
      labels:
        app: cineflux-autoxml
    spec:
      containers:
      - name: cineflux-autoxml
        image: your-registry.com/cineflux-autoxml:latest
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "0.5"
            memory: "256Mi"
        env:
        - name: NODE_ENV
          value: "production"
        - name: VITE_APP_VERSION
          value: "0.1.0"
        - name: VITE_FEATURE_FLAGS
          value: '{"debugMode":false,"experimentalFeatures":false,"advancedAnalysis":true}'
```

#### Kubernetes Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cineflux-autoxml
spec:
  selector:
    app: cineflux-autoxml
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

#### Kubernetes Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cineflux-autoxml
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
    nginx.ingress.kubernetes.io/add-headers: |
      Cross-Origin-Embedder-Policy: require-corp
      Cross-Origin-Opener-Policy: same-origin
spec:
  rules:
  - host: cineflux.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cineflux-autoxml
            port:
              number: 80
```

## Performance Monitoring Setup

### Recommended Monitoring Tools

#### Client-Side Monitoring

1. **Web Vitals**:
   - Integrate the `web-vitals` library to track Core Web Vitals
   - Example implementation:

   ```javascript
   import { getCLS, getFID, getLCP } from 'web-vitals';

   function sendToAnalytics(metric) {
     // Send the metric to your analytics service
     console.log(metric);
   }

   getCLS(sendToAnalytics);
   getFID(sendToAnalytics);
   getLCP(sendToAnalytics);
   ```

2. **Performance Observer**:
   - Use the Performance Observer API to monitor specific metrics
   - Example implementation:

   ```javascript
   const observer = new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       console.log(`${entry.name}: ${entry.startTime}ms`);
     }
   });

   observer.observe({ entryTypes: ['resource', 'navigation', 'longtask'] });
   ```

3. **Custom Performance Tracking**:
   - CineFlux-AutoXML includes a performance monitoring utility in `src/utils/performance/perfMonitor.ts`
   - This utility tracks application-specific metrics like audio analysis time, video processing time, etc.

#### Server-Side Monitoring

1. **Nginx Metrics**:
   - Enable Nginx status module
   - Use Prometheus and Grafana for visualization

2. **Docker Metrics**:
   - Use Docker stats API
   - Integrate with Prometheus using cAdvisor

3. **Cloud Provider Monitoring**:
   - AWS CloudWatch
   - Google Cloud Monitoring
   - Azure Monitor

### Key Metrics to Track

#### Core Web Vitals

- **Largest Contentful Paint (LCP)**: Measures loading performance
- **First Input Delay (FID)**: Measures interactivity
- **Cumulative Layout Shift (CLS)**: Measures visual stability

#### Application-Specific Metrics

- **Time to Interactive (TTI)**: Time until the application is fully interactive
- **Audio Analysis Time**: Time taken to analyze audio files
- **Video Analysis Time**: Time taken to analyze video files
- **Memory Usage**: Peak memory usage during processing
- **WebAssembly Load Time**: Time taken to load and compile WebAssembly modules
- **Export Generation Time**: Time taken to generate XML exports

### Performance Optimization Strategies

1. **WebAssembly Optimization**:
   - Use WebAssembly SIMD instructions where available
   - Implement threading for compute-intensive tasks
   - Optimize memory usage in WebAssembly modules

2. **Resource Loading**:
   - Implement lazy loading for non-critical resources
   - Use a CDN for WebAssembly modules in production
   - Implement code splitting to reduce initial load time

3. **Caching Strategies**:
   - Cache processed data in IndexedDB
   - Use service workers for offline support
   - Implement memory caching for frequently accessed data

4. **Rendering Optimization**:
   - Use React.memo for expensive components
   - Implement virtualized lists for large datasets
   - Optimize canvas rendering for waveform visualization

5. **Network Optimization**:
   - Enable gzip/Brotli compression
   - Set appropriate cache headers
   - Minimize API calls and batch requests

## Troubleshooting

### Common Deployment Issues

#### WebAssembly Not Loading

**Symptoms**:
- Console errors related to WebAssembly
- Application fails to process media files

**Possible Causes**:
- Missing CORS headers for SharedArrayBuffer
- Incorrect MIME type for WebAssembly files
- Browser doesn't support WebAssembly features

**Solutions**:
- Verify CORS headers are correctly set
- Check MIME type configuration for .wasm files
- Test in a supported browser (Chrome 74+, Firefox 78+, Edge 79+)

#### Security Header Issues

**Symptoms**:
- Console warnings about SharedArrayBuffer
- Cross-origin isolation errors

**Possible Causes**:
- Missing or incorrect security headers
- Headers not applied to all routes

**Solutions**:
- Verify all required headers are set
- Check header configuration for all routes
- Use browser developer tools to inspect headers

#### Build Failures

**Symptoms**:
- Build process fails
- Deployment fails with build errors

**Possible Causes**:
- Missing dependencies
- Incompatible Node.js version
- Environment configuration issues

**Solutions**:
- Check build logs for specific errors
- Verify Node.js version matches requirements
- Check environment variable configuration

### Environment-Specific Issues

#### Netlify Issues

**Issue**: Headers not applied
**Solution**: Verify `netlify.toml` is in the root directory and has the correct format

**Issue**: Build fails
**Solution**: Check build command and Node.js version in `netlify.toml`

#### Vercel Issues

**Issue**: Headers not applied
**Solution**: Verify `vercel.json` has the correct header configuration

**Issue**: Routing issues
**Solution**: Check route configuration in `vercel.json`

#### Docker Issues

**Issue**: Container exits immediately
**Solution**: Check logs with `docker logs <container_id>`

**Issue**: Performance issues in container
**Solution**: Adjust resource limits in Docker Compose file

## Appendix

### Deployment Checklist

- [ ] Build the application with production settings
- [ ] Configure security headers for cross-origin isolation
- [ ] Set up environment variables for the target environment
- [ ] Test WebAssembly functionality in the deployed environment
- [ ] Verify all routes work correctly (SPA routing)
- [ ] Check performance metrics
- [ ] Set up monitoring
- [ ] Configure SSL/TLS
- [ ] Test in multiple browsers

### Additional Resources

- [WebAssembly Documentation](https://webassembly.org/)
- [Cross-Origin Isolation Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Web Vitals Documentation](https://web.dev/vitals/)
