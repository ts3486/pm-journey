# Fly.io Deployment Guide

Complete guide to deploy pm-journey (Frontend + Backend + PostgreSQL) on Fly.io with private access.

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Install Fly.io CLI](#2-install-flyio-cli)
3. [Create Fly.io Account & Login](#3-create-flyio-account--login)
4. [Deploy PostgreSQL Database](#4-deploy-postgresql-database)
5. [Deploy Backend (Rust/Axum)](#5-deploy-backend-rustaxum)
6. [Deploy Frontend (Next.js)](#6-deploy-frontend-nextjs)
7. [Configure Private Access with WireGuard](#7-configure-private-access-with-wireguard)
8. [Verify Deployment](#8-verify-deployment)
9. [Useful Commands](#9-useful-commands)

---

## 1. Prerequisites

- [ ] Fly.io account (free tier available)
- [ ] Credit card (required by Fly.io, but free tier won't charge)
- [ ] Docker installed locally (for building images)
- [ ] WireGuard client installed (for private access)

---

## 2. Install Fly.io CLI

```bash
# macOS
brew install flyctl

# Or via curl (any OS)
curl -L https://fly.io/install.sh | sh
```

Verify installation:
```bash
fly version
```

---

## 3. Create Fly.io Account & Login

```bash
# This opens browser for signup/login
fly auth signup

# Or if you already have an account
fly auth login
```

Verify you're logged in:
```bash
fly auth whoami
```

---

## 4. Deploy PostgreSQL Database

### 4.1 Create Postgres Cluster

```bash
fly postgres create \
  --name pm-journey-db \
  --region nrt \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 1
```

> **Note:** `nrt` = Tokyo region. Change to your preferred region.
> Run `fly platform regions` to see all available regions.

### 4.2 Save Database Credentials

The command above outputs credentials. **Save them securely!**

```
Username:    postgres
Password:    <generated-password>
Hostname:    pm-journey-db.internal
Proxy port:  5432
Postgres port: 5433
Connection string: postgres://postgres:<password>@pm-journey-db.internal:5432
```

### 4.3 Verify Database is Running

```bash
fly status --app pm-journey-db
```

### 4.4 Connect to Database (Optional - for testing)

```bash
fly postgres connect --app pm-journey-db
```

---

## 5. Deploy Backend (Rust/Axum)

### 5.1 Create Backend Dockerfile

Create `backend/Dockerfile` if it doesn't exist:

```dockerfile
# Build stage
FROM rust:1.75-bookworm AS builder

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy main.rs to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source code
COPY src ./src

# Build the actual binary
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/backend /app/backend

EXPOSE 3001

CMD ["./backend"]
```

### 5.2 Initialize Fly App for Backend

```bash
cd backend

fly launch \
  --name pm-journey-backend \
  --region nrt \
  --no-deploy
```

### 5.3 Configure fly.toml for Backend

Edit `backend/fly.toml`:

```toml
app = "pm-journey-backend"
primary_region = "nrt"

[build]

[env]
  RUST_LOG = "info"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

### 5.4 Attach Database to Backend

```bash
fly postgres attach pm-journey-db --app pm-journey-backend
```

This automatically sets `DATABASE_URL` secret in your backend app.

### 5.5 Set Additional Secrets (if needed)

```bash
# Example: Set API keys or other secrets
fly secrets set GEMINI_API_KEY="your-api-key" --app pm-journey-backend
```

### 5.6 Deploy Backend

```bash
cd backend
fly deploy
```

### 5.7 Verify Backend Deployment

```bash
fly status --app pm-journey-backend
fly logs --app pm-journey-backend
```

---

## 6. Deploy Frontend (Next.js)

### 6.1 Create Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set backend URL for build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN corepack enable pnpm && pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 6.2 Update next.config.js for Standalone Output

Ensure `frontend/next.config.js` includes:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
}

module.exports = nextConfig
```

### 6.3 Initialize Fly App for Frontend

```bash
cd frontend

fly launch \
  --name pm-journey-frontend \
  --region nrt \
  --no-deploy
```

### 6.4 Configure fly.toml for Frontend

Edit `frontend/fly.toml`:

```toml
app = "pm-journey-frontend"
primary_region = "nrt"

[build]
  [build.args]
    NEXT_PUBLIC_API_URL = "https://pm-journey-backend.fly.dev"

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

### 6.5 Deploy Frontend

```bash
cd frontend
fly deploy
```

### 6.6 Verify Frontend Deployment

```bash
fly status --app pm-journey-frontend
fly logs --app pm-journey-frontend
```

---

## 7. Configure Private Access with WireGuard

By default, Fly.io apps are public. To make them private and accessible only to your team, use Fly.io's built-in WireGuard integration.

### 7.1 Overview

Fly.io has a built-in private network (6PN) that connects all your apps via `.internal` addresses. To access this network from your local machine, Fly.io provides WireGuard tunnels - no additional services like Tailscale needed.

**How it works:**
- Each collaborator creates their own WireGuard tunnel to Fly.io
- Collaborators must be members of your Fly.io organization
- Once connected, they can access `.internal` addresses

### 7.2 Add Collaborators to Your Fly.io Organization

```bash
# Invite a collaborator by email
fly orgs invite <email> --org personal

# Or create a new organization for the team
fly orgs create pm-journey-team
fly orgs invite collaborator@example.com --org pm-journey-team
```

Collaborators will receive an email invitation to join.

### 7.3 Make Apps Private (Internal Only)

Update `backend/fly.toml` to remove public access:

```toml
app = "pm-journey-backend"
primary_region = "nrt"

[build]

[env]
  RUST_LOG = "info"
  PORT = "3001"

# Internal service only - no public internet access
[[services]]
  internal_port = 3001
  protocol = "tcp"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

Update `frontend/fly.toml` similarly if you want the frontend private too.

Then redeploy:
```bash
cd backend && fly deploy
cd frontend && fly deploy
```

### 7.4 Set Up WireGuard (Each Collaborator)

Each team member needs to do this once:

#### Step 1: Install WireGuard Client

**macOS:**
```bash
brew install wireguard-tools
# Or install the GUI app from App Store: "WireGuard"
```

**Windows:**
Download from [wireguard.com/install](https://www.wireguard.com/install/)

**Linux:**
```bash
sudo apt install wireguard  # Debian/Ubuntu
sudo dnf install wireguard-tools  # Fedora
```

#### Step 2: Create WireGuard Tunnel

```bash
# Login to Fly.io first
fly auth login

# Create a WireGuard config for your region
fly wireguard create
```

This will:
1. Generate a WireGuard config file (e.g., `fly-nrt.conf`)
2. Save it to your current directory

#### Step 3: Connect to Fly.io Private Network

**Using CLI (recommended):**
```bash
# Connect
sudo wg-quick up ./fly-nrt.conf

# Disconnect when done
sudo wg-quick down ./fly-nrt.conf
```

**Using WireGuard GUI App:**
1. Open WireGuard app
2. Click "Import tunnel(s) from file"
3. Select the `.conf` file
4. Toggle the tunnel on/off as needed

#### Step 4: Verify Connection

```bash
# Test DNS resolution
dig pm-journey-backend.internal AAAA

# Test connectivity
curl http://pm-journey-backend.internal:3001/health
```

### 7.5 Access Your Apps

Once connected via WireGuard:

| App | Private URL |
|-----|-------------|
| Frontend | `http://pm-journey-frontend.internal:3000` |
| Backend | `http://pm-journey-backend.internal:3001` |
| Database | `pm-journey-db.internal:5432` |

### 7.6 Managing WireGuard Peers

```bash
# List all WireGuard peers in your org
fly wireguard list

# Remove a peer (e.g., when someone leaves the team)
fly wireguard remove <peer-name>

# Reset your own WireGuard config
fly wireguard reset
```

---

### Alternative: Application-Level Authentication

Keep apps public but require authentication:

#### 7.C.1 Add Auth to Frontend (NextAuth.js)

```bash
cd frontend
pnpm add next-auth
```

Create `frontend/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const allowedEmails = [
  "user1@example.com",
  "user2@example.com",
  // Add your allowed users
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (allowedEmails.includes(credentials?.email || "")) {
          return { id: "1", email: credentials?.email }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
})

export { handler as GET, handler as POST }
```

#### 7.C.2 Protect Backend with API Key

Add middleware in your Rust backend to check for API key:

```rust
// In your Axum backend
async fn auth_middleware(
    headers: HeaderMap,
    next: Next,
) -> Result<Response, StatusCode> {
    let api_key = headers
        .get("X-API-Key")
        .and_then(|v| v.to_str().ok());

    let expected_key = std::env::var("API_KEY").ok();

    if api_key == expected_key.as_deref() {
        Ok(next.run(request).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
```

Set the API key:
```bash
fly secrets set API_KEY="your-secure-api-key" --app pm-journey-backend
```

---

## 8. Verify Deployment

### 8.1 Check All Apps Status

```bash
fly status --app pm-journey-db
fly status --app pm-journey-backend
fly status --app pm-journey-frontend
```

### 8.2 View Logs

```bash
# Backend logs
fly logs --app pm-journey-backend

# Frontend logs
fly logs --app pm-journey-frontend

# Database logs
fly logs --app pm-journey-db
```

### 8.3 Test Connectivity

```bash
# If using WireGuard:
curl http://pm-journey-backend.internal:3001/health

# If public:
curl https://pm-journey-backend.fly.dev/health
```

### 8.4 Access Your Apps

| App | URL (Public) | URL (Private via WireGuard) |
|-----|--------------|----------------------------|
| Frontend | https://pm-journey-frontend.fly.dev | http://pm-journey-frontend.internal:3000 |
| Backend | https://pm-journey-backend.fly.dev | http://pm-journey-backend.internal:3001 |
| Database | N/A | pm-journey-db.internal:5432 |

---

## 9. Useful Commands

### Deployment

```bash
# Deploy an app
fly deploy --app <app-name>

# Deploy with build logs
fly deploy --app <app-name> --verbose
```

### Scaling

```bash
# Scale to 0 (stop all machines)
fly scale count 0 --app <app-name>

# Scale to 1 machine
fly scale count 1 --app <app-name>

# Scale VM size
fly scale vm shared-cpu-2x --app <app-name>
```

### Secrets

```bash
# List secrets
fly secrets list --app <app-name>

# Set secret
fly secrets set KEY=value --app <app-name>

# Remove secret
fly secrets unset KEY --app <app-name>
```

### Database

```bash
# Connect to Postgres
fly postgres connect --app pm-journey-db

# Create database backup
fly postgres backup create --app pm-journey-db

# List backups
fly postgres backup list --app pm-journey-db
```

### Debugging

```bash
# SSH into a running machine
fly ssh console --app <app-name>

# View machine status
fly machine list --app <app-name>

# Restart app
fly apps restart <app-name>
```

### Costs

```bash
# View billing/usage
fly billing
```

---

## Troubleshooting

### Backend can't connect to database

1. Verify DATABASE_URL is set:
   ```bash
   fly secrets list --app pm-journey-backend
   ```

2. Check database is running:
   ```bash
   fly status --app pm-journey-db
   ```

3. Verify internal DNS:
   ```bash
   fly ssh console --app pm-journey-backend
   # Inside the container:
   nslookup pm-journey-db.internal
   ```

### Frontend can't reach backend

1. Check backend URL in frontend build args
2. Verify backend is running: `fly status --app pm-journey-backend`
3. Check CORS settings in backend

### WireGuard not connecting

1. Verify the tunnel is active:
   ```bash
   sudo wg show
   ```

2. Check if the config file is valid:
   ```bash
   fly wireguard list
   ```

3. Try recreating the tunnel:
   ```bash
   fly wireguard reset
   fly wireguard create
   ```

4. Ensure your firewall allows UDP traffic on port 51820

---

## Cost Summary

| Resource | Free Tier | Your Usage |
|----------|-----------|------------|
| Shared CPU VMs | 3 VMs | 2 (frontend + backend) |
| Postgres | 1 instance | 1 |
| Outbound transfer | 160 GB/month | Varies |
| **Estimated monthly cost** | | **$0** (within free tier) |

---

## Next Steps

1. [ ] Set up CI/CD with GitHub Actions
2. [ ] Configure custom domain
3. [ ] Set up monitoring/alerts
4. [ ] Create staging environment
5. [ ] Deploy landing page to Vercel