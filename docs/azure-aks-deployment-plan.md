# pm-journey Azure AKS Deployment Plan

_Last updated: 2026-01-31_

## Overview
- Deploy the Next.js frontend and Axum backend to Azure Kubernetes Service (AKS) with Microsoft-secured network, identity, and observability guardrails, anchored in a hub-spoke Azure Virtual Network plus Network Security Groups (NSGs).
- Use Azure Container Registry (ACR) for image storage, Azure Front Door + Application Gateway/WAF for global ingress, and GitHub Actions for CI/CD.
- Promote changes through dev → production AKS namespaces with staged rollouts and automated monitoring.

## Phase & Task Breakdown

### Phase 0 – Architecture Readiness
**Objective:** lock down the target topology, security posture, and baseline requirements before touching infrastructure.
- [x] Inventory frontend, backend, background jobs, and supporting services to confirm containerization scope and runtime dependencies.
  - **Frontend (`frontend/`)**: Next.js 16.1 app router w/ React 19, Tailwind 4, TanStack Query 5, Zod validation, Vitest/Playwright suites. Targets Node.js 20 LTS in production containers; static assets served from Azure Front Door caching tier, SSR handled inside AKS using Node runtime. Relies on localStorage/IndexedDB for offline sessions plus HTTPS fetches to backend API.
  - **Backend (`backend/`)**: Rust 1.75 Axum 0.7 API with Tokio runtime, utoipa OpenAPI, SQLx/PostgreSQL, tracing, reqwest-based Gemini calls. Binary listens on `0.0.0.0:3001`, exposes health endpoints per feature module, and depends on env vars (`DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_DEFAULT_MODEL`, `RUST_LOG`).
  - **Supporting data plane**: Azure Database for PostgreSQL Flexible Server (primary state store), Azure Storage (Blob) for scenario/catalog exports & future log retention, Azure Key Vault for secret material (DB creds, Gemini key, signing keys). Docker images will be built via multi-stage BuildKit (node:20-bookworm + rust:1.75-slim) and pushed to Azure Container Registry (ACR) with content trust enabled.
  - **Background jobs**: No long-running workers today; asynchronous tasks (e.g., evaluation generation, imports) run inside API pods. Future batch processing will use Kubernetes CronJobs in the same cluster namespace, so container standards must cover that path but no separate runtime is required yet.
  - **Third-party integrations**: Google Gemini API via HTTPS (egress allow-list), GitHub OAuth (if enabled later) handled client-side, optional analytics (to be finalized). Network egress policies must explicitly allow `generativelanguage.googleapis.com`.

- [x] Document the reference architecture (hub-spoke VNet, subnets, inbound/outbound controls, managed identity plan) using Azure Well-Architected templates.
  - **Topology**: Hub-spoke using Azure Virtual WAN guidance. Hub VNet `10.10.0.0/16` hosts shared services (Azure Firewall Premium subnet `10.10.0.0/24`, Bastion `10.10.1.0/27`, shared services `10.10.2.0/24`). Spoke `spk-app-01` VNet `10.20.0.0/16` peers to hub with UDR forcing outbound through Firewall.
  - **Spoke subnets**: `10.20.0.0/20` (AKS system nodepool, `AzureFirewallSubnet` disallowed), `10.20.16.0/20` (AKS user nodepool), `10.20.32.0/23` (Azure Application Gateway WAF v2), `10.20.34.0/23` (Private Endpoints for Key Vault, PostgreSQL, Storage), `10.20.36.0/24` (Azure Container Registry private endpoint). Each subnet has NSG default deny inbound + required service tags.
  - **Ingress flow**: Public -> Azure Front Door Premium (global WAF + CDN) -> Private Link service to Application Gateway (private) -> AKS internal load balancer/Ingress Controller -> services. Front Door enforces WAF policies, TLS 1.2+, mutual auth for management plane. Application Gateway sits in dedicated subnet with autoscaling + zone redundancy, only accepts Front Door origin via locked-down backend pool.
  - **Outbound controls**: AKS egress forced through Azure Firewall (DNAT for necessary endpoints). Allow-list: ACR FQDNs, Azure Monitor, Microsoft Container Registry, `generativelanguage.googleapis.com`, GitHub Packages, OS security mirrors. All other outbound blocked by default.
  - **Managed identity placement**: Hub hosts identity & security services (Azure AD, Key Vault). AKS uses Managed Identity add-on with workload identity federation. User-assigned identities live in hub resource group and are referenced by AKS namespaces. Firewall, Front Door, Application Gateway log to centralized Log Analytics workspace in hub.

- [x] Define workload identity mappings for GitHub Actions, AKS pods, and any external services (Key Vault, Storage, Cosmos DB, etc.).
  - **GitHub Actions**: Create Entra ID app `pmjourney-ci` with workload identity federation per environment (`refs/heads/main` → prod, `refs/heads/dev` → dev). Roles: `AcrPush` on ACR, `Azure Kubernetes Service RBAC Admin` (dev) / `Cluster User` (prod) scoped to corresponding AKS namespaces, `Key Vault Secrets Officer` (dev only) for bootstrap. Actions authenticate via `azure/login@v2` with `permissions: id-token` and never store secrets.
  - **AKS namespaces & pods**: Assign per-component user-assigned identities: `id-frontend` (read-only access to Storage + Key Vault for feature flags), `id-backend` (Key Vault secrets `get`, Azure PostgreSQL `AzureRoleBasedAccess` via AAD authentication), `id-cron` (Storage + Service Bus in future). Bind via Kubernetes ServiceAccount annotations + Azure workload identity webhook.
  - **External services**: Key Vault uses private endpoint inside spoke; pods retrieve secrets through Azure SDK + workload identity. Azure Storage containers (`session-exports`, `scenario-artifacts`) restricted to `Storage Blob Data Contributor` for backend identity. Cosmos DB is not required initially; placeholder identity mapping reserved for future analytics workspace. GitHub Actions and AKS identities gain Reader on Log Analytics + Monitor to emit telemetry. Gemini API key stored in Key Vault secret `Gemini--ApiKey`, only backend identity may fetch, preventing leak.

- [x] Capture regulatory/availability requirements to choose the number of regions, availability zones, and data residency constraints.
  - **Data classification**: Stores limited personal data (user display names, free-form text, decision logs) plus proprietary scenario IP. Classify as Confidential (C2) under company policy; encryption in transit + at rest mandatory, double encryption for backups storing scenario IP.
  - **Regions**: Primary deployment in `Japan East` (zones 1-3) to meet latency + residency needs. Secondary hot-standby in `Japan West` for disaster recovery with async PostgreSQL replication + ACR geo-replication. Azure Front Door handles active-passive failover with health probes every 30s.
  - **Availability targets**: Frontend+API composite SLA ≥ 99.9% during beta, scaling to 99.95% before GA. AKS node pools span 3 AZs; PostgreSQL Flexible Server provisioned with zone redundant high availability. Recovery time objective (RTO) 30 minutes; recovery point objective (RPO) < 5 minutes via PITR backups every 5 min + storage account GRS.
  - **Data residency**: All customer data, logs, container images, and backups remain in Japan regions. Diagnostic exports to Log Analytics + Storage use geo-redundant replication restricted to the Japan East/West pair. Gemini API currently US-hosted; contract review ensures compliance for any cross-border transfer (documented exception if needed).
  - **Compliance hooks**: SOC 2 Type I controls targeted in FY26 Q2—Key Vault logging retained 1 year, Azure AD audit logs 90 days, GitHub audit mirrored to Log Analytics via GH Advanced Security export.

- [x] Produce a threat model + security baseline (network policies, pod security standards, image signing, vulnerability scanning expectations).
  - **Threat scenarios**:
    - *Supply chain*: Compromised container image or npm/crate dependency. Mitigation: enable ACR content trust + cosign signing, nightly Dependabot scanning, GitHub Advanced Security alerts. `docker buildx bake` pipeline enforces `npm ci --ignore-scripts` and `cargo fetch` with lockfiles checked in.
    - *Credential exfiltration*: Gemini API key, DB creds, or JWT signing keys leaked from pods. Mitigation: secrets only in Key Vault, workload identity tokens w/ 1h TTL, CSI Secret Store driver auto-rotates, no `.env` baked into images.
    - *Lateral movement in cluster*: Compromised frontend pod pivoting to backend or control plane. Mitigation: Azure CNI network policies isolating namespaces, Calico policy default deny, separate node pools for frontend SSR vs backend API, Defender for Cloud agent on nodes.
    - *Data exfiltration via egress*: Attacker uses API pod to send data outward. Mitigation: Firewall outbound allow-list + Azure Policy ensures `egressUdr` attached; `kubectl exec` disabled via Azure RBAC + audit.
    - *DoS / abusive traffic*: Bot swarms hitting chat endpoints. Mitigation: Front Door WAF managed rules + rate limiting, App Gateway WAF custom rules for /api/messages, autoscaling HPAs with PodDisruptionBudgets to keep capacity.
  - **Security baseline**:
    - Pod Security: Enforce Kubernetes Pod Security Standards `restricted` via Azure Policy. All workloads run as non-root, drop cap NET_RAW, read-only root filesystem for frontend.
    - Network: Namespaced Kubernetes NetworkPolicies (deny-all, allow only required ports), Azure Firewall threat intel alert mode, NSGs blocking peer-to-peer intra-subnet traffic.
    - Images: Multi-stage Dockerfiles w/ distroless where possible, `trivy` scan in CI, ACR Tasks daily vulnerability scan, cosign signing pipeline w/ Rekor transparency log.
    - Observability & response: Azure Monitor Container Insights, centralized Log Analytics workspace with Microsoft Sentinel analytics rule for unusual AKS API calls. Enable Microsoft Defender for Cloud (AKS + ACR) for runtime threat detection.
    - Compliance automation: Azure Policy assignments for `AKS-SEC-Restricted-SecurityContext`, `Audit-VNet-to-frontdoor`, `KeyVault-logging-enabled`, plus Terraform guardrails ensuring diagnostics shipped before resources can be created.

### Phase 1 – Container & Configuration Standards
**Objective:** create reproducible images and deployment manifests with strict separation of code, config, and secrets.
- [x] Author multi-stage Dockerfiles for `frontend` (Next.js 16.1/React 19) and `backend` (Rust 1.75/Axum 0.7) with BuildKit caching + deterministic builds.
- [x] Add language-specific health endpoints and readiness probes to each service for Kubernetes liveness/readiness.
- [x] Introduce Helm (or Kustomize) charts that define Deployments, Services, Ingress, ConfigMaps, Secrets, and HorizontalPodAutoscalers per component.
- [x] Standardize environment overlays (`values.dev.yaml`, `values.prod.yaml`) that hold resource requests/limits and replica counts.
- [ ] Wire Azure Key Vault + workload identity so pods retrieve secrets at runtime; ensure no secrets exist in Docker images or git history.
- [ ] Define logging sidecars or OpenTelemetry exporters where needed, plus common labels/annotations for Azure Monitor scraping **(perform this after every other Phase 1 task so observability is the final validation step).**

### Phase 2 – Azure Infrastructure
**Objective:** provision the cloud foundation that will host and protect the workloads.
- [ ] Create IaC (Terraform or Bicep) for the following resources: Resource Groups, hub-spoke VNets/subnets, NSGs, Azure Firewall (if required), Private DNS zones.
- [ ] Deploy Azure Container Registry with geo-replication and enable content trust/image scanning.
- [ ] Stand up AKS (system + user node pools, autoscaling, availability zones) with Azure AD workload identity and managed Azure CNI networking.
- [ ] Deploy Azure Front Door Premium in front of Application Gateway WAF; configure TLS certificates (Key Vault-backed) and routing rules per service path.
- [ ] Connect App Gateway to AKS ingress via an internal load balancer; enforce web application firewall policies and rate limiting.
- [ ] Configure Azure DNS zones/records for primary domains and any vanity subdomains (e.g., `app.pm-journey.dev`, `api.pm-journey.dev`).
- [ ] Issue and validate production SSL certificates (Front Door custom domain + App Gateway backend) using Azure Key Vault certificates to provide auditable TLS proof for the prod environment.
- [ ] Enable diagnostic settings on all services, sending logs/metrics to a Log Analytics workspace defined in IaC.

### Phase 3 – CI/CD & Promotion Workflow
**Objective:** automate build, test, and deploy steps with GitHub Actions targeting each environment.
- Baseline workflow (`.github/workflows/deploy.yml`) already builds/test both apps, pushes images to the environment-specific ACR, and runs `helm upgrade` into the `dev` namespace when `dev` branch updates, or the `prod` namespace when `main` updates. Remaining tasks refine this pipeline with stronger quality gates, security scans, and release automation.
- [ ] Create GitHub Action reusable workflows that lint, run unit tests (Vitest, cargo test, etc.), and build container images with `docker/build-push-action` or `az acr build`.
- [ ] Configure workload identity federation so GitHub Actions authenticate to Azure without secrets; grant least-privilege roles for ACR push and AKS deploy.
- [ ] Push versioned images to ACR per commit/branch tag, using semantic or git SHA tagging conventions.
- [ ] Add deployment jobs that run `helm upgrade --install` (or `azure/k8s-deploy`) into dev namespace, then gate prod on manual approvals or automated integration test passes.
- [ ] Publish deployment status back to pull requests and capture release artifacts (Helm values, manifests, SBOMs).
- [ ] Implement automated rollback triggers (failed probes, high error rates) leveraging AKS automated deployments or Argo Rollouts if adopted.

### Phase 4 – Release Resilience & Scaling
**Objective:** guarantee high availability, safe rollouts, and capacity elasticity.
- [ ] Configure liveness/readiness probes, PodDisruptionBudgets, and maxUnavailable/maxSurge values for each Deployment.
- [ ] Enable AKS cluster autoscaler and per-deployment HPAs based on CPU, memory, and custom metrics (requests/minute, queue depth).
- [ ] Set up automated canary/blue-green flows (e.g., via Front Door routing rules or service mesh) for progressive traffic shifting.
- [ ] Expand to multi-zone or multi-region AKS clusters; configure Front Door health probes + priority routing for failover.
- [ ] Schedule recurring chaos/resiliency drills (node drain, pod delete, region failover) and document runbooks.

### Phase 5 – Observability & SecOps
**Objective:** give teams full insight into performance, security, and compliance.
- [ ] Connect AKS/ACR/App Gateway/Front Door diagnostics to Azure Monitor, Log Analytics, and Application Insights.
- [ ] Define dashboards for request latency, error budget burn, frontend Core Web Vitals, API p95 latency, and queue backlogs.
- [ ] Configure alerts (PagerDuty/Teams) for availability, saturation, security anomalies (WAF blocked requests, suspicious auth), and cost thresholds.
- [ ] Enable Microsoft Defender for Cloud on AKS and container registries; enforce image vulnerability policies in CI/CD.
- [ ] Capture centralized audit logs for GitHub Actions, Azure RBAC, and Kubernetes API, storing them per compliance requirements.

## Milestone Handoff Checklist
- [ ] Architecture decision record (ADR) package signed off by security and platform teams.
- [ ] IaC pipelines applied successfully in non-prod, with drift detection enabled.
- [ ] CI/CD workflows green across unit/integration/E2E suites and deploying to dev namespace.
- [ ] Operational runbooks (deploy, rollback, incident response) and on-call rotations assigned.
- [ ] Production readiness review completed before opening global traffic via Front Door.
