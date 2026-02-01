# Phase 1 Completion Guide (Beginner-Friendly)

_Last updated: 2026-02-01_

Phase 1 already covers the container builds, health endpoints, and Helm chart. Two items remain:
1. Wire Azure Key Vault + Azure AD Workload Identity so the apps read secrets at runtime.
2. Add logging/OpenTelemetry hooks so AKS can stream metrics/logs into Azure Monitor.

Follow the steps below to finish Phase 1 without needing deep Azure expertise.

---

## Part A – Secrets via Azure Key Vault + Workload Identity

### Step 1: Create the secret store
1. Open Azure Cloud Shell or your own terminal with the Azure CLI logged in.
2. Choose resource names in the Japan East region (example values shown below; replace with your actual names):
   ```bash
   RESOURCE_GROUP=pm-journey
   KEYVAULT_NAME=pm-journey-dev
   LOCATION=japaneast
   az group create -n $RESOURCE_GROUP -l $LOCATION
   az keyvault create -n $KEYVAULT_NAME -g $RESOURCE_GROUP -l $LOCATION --enable-rbac-authorization true
   ```
3. Store the secrets the apps need. For example:
   ```bash
   az keyvault secret set --vault-name $KEYVAULT_NAME -n Database--Url --value "postgres://..."
   az keyvault secret set --vault-name $KEYVAULT_NAME -n Gemini--ApiKey --value "sk-..."
   ```

### Step 2: Grant access to AKS workloads
1. In Azure Portal create **two user-assigned managed identities** (UAMI), one for the backend (`id-backend`) and one for the frontend (`id-frontend`). Place them in the shared resource group so any cluster can reference them.
2. Assign Key Vault permissions using role-based access control:
   ```bash
   az role assignment create --assignee <backend-uami-client-id> \
     --role "Key Vault Secrets User" --scope $(az keyvault show -n $KEYVAULT_NAME --query id -o tsv)
   ```
3. Link each identity to the AKS cluster using the Azure AD workload identity feature:
   - Enable workload identity when you create/upgrade AKS (`--enable-oidc-issuer --enable-workload-identity`).
   - Create federated identity credentials so the Kubernetes ServiceAccounts in namespaces `dev` and `prod` can exchange tokens for the corresponding UAMI.

### Step 3: Install the Azure Key Vault provider for Secrets Store CSI
1. In your cluster run:
   ```bash
   helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
   helm upgrade --install csi-secrets-store-provider-azure/csi-secrets-store-provider-azure \
     secrets-store-csi-driver -n kube-system
   ```
2. Commit a `SecretProviderClass` manifest per environment. I started this for you under `deploy/k8s/secret-provider/backend-dev.yaml` and `backend-prod.yaml`; just replace the placeholder values (`<BACKEND_UAMI_CLIENT_ID>`, `<AZURE_TENANT_ID>`, etc.) with your real IDs. Each file follows this structure:
   ```yaml
   apiVersion: secrets-store.csi.x-k8s.io/v1
   kind: SecretProviderClass
   metadata:
     name: backend-akv        # must match the value you reference in Helm
     namespace: dev           # change to prod for the production file
   spec:
     provider: azure
     parameters:
       usePodIdentity: "false"
       useVMManagedIdentity: "false"
       userAssignedIdentityID: <BACKEND_UAMI_CLIENT_ID>
       keyvaultName: kv-pmjourney-je
       cloudName: AzurePublicCloud
       objects: |
         array:
           - |
             objectName: Database--Url
             objectType: secret
             objectAlias: DATABASE_URL
           - |
             objectName: Gemini--ApiKey
             objectType: secret
             objectAlias: GEMINI_API_KEY
       tenantId: <AZURE_TENANT_ID>
     secretObjects:
       - secretName: backend-secrets
         type: Opaque
         data:
           - key: DATABASE_URL
             objectName: DATABASE_URL
           - key: GEMINI_API_KEY
             objectName: GEMINI_API_KEY
   ```
3. Update the backend Deployment template (`deploy/helm/pm-journey/templates/backend-deployment.yaml`) to mount the CSI volume and reference the Kubernetes Secret. This keeps the Helm chart the single source of truth.

### Step 4: Update Helm values and ServiceAccounts
1. Add `serviceAccount` blocks to the Helm chart so each workload can specify its ServiceAccount name.
2. In `values.dev.yaml` and `values.prod.yaml`, set the ServiceAccount name and SecretProviderClass references:
   ```yaml
   backend:
     serviceAccountName: backend-wi
     secretProviderClass: backend-akv
   ```
3. Patch the Deployment templates to include:
   ```yaml
   serviceAccountName: {{ .Values.backend.serviceAccountName }}
   volumes:
     - name: secrets-store-inline
       csi:
         driver: secrets-store.csi.k8s.io
         readOnly: true
         volumeAttributes:
           secretProviderClass: {{ .Values.backend.secretProviderClass }}
   containers:
     - name: backend
       volumeMounts:
         - name: secrets-store-inline
           mountPath: /mnt/secrets-store
           readOnly: true
   ```
4. Redeploy to dev, verify the pod picks up the secrets, then repeat for prod.

### Step 5: Clean the repo
- Remove any leftover `.env` secrets from git (add to `.gitignore` if needed) and rely on Key Vault going forward.

---

## Part B – Logging & Observability *(Optional for later)*

### Step 6: Decide on the instrumentation method
- If you want to finish all infrastructure first, you may skip this section temporarily. Just remember Phase 1 in the master plan is not formally complete until observability is in place, so come back here once the rest of the work is stable.
- Simplest option: use Azure Monitor Container Insights (already enabled through AKS) and add structured logs via tracing.
- Advanced option: integrate OpenTelemetry (OTel) for both frontend and backend.

### Step 7: Backend instrumentation
1. Add dependencies in `backend/Cargo.toml`:
   ```toml
   opentelemetry = { version = "0.23", features = ["rt-tokio"] }
   opentelemetry-otlp = { version = "0.16", features = ["tokio"] }
   tracing-opentelemetry = "0.23"
   ```
2. Initialize OTLP export in `backend/src/middleware/telemetry.rs` after `init_tracing()` so spans/metrics go to Azure Monitor (via the OTLP endpoint `https://otlp.ingest.monitor.azure.com`).
3. Capture request IDs, user IDs (if available), and error fields so dashboards can filter easily.
4. Confirm logs appear in Log Analytics using the `AzureDiagnostics` table.

### Step 8: Frontend instrumentation
1. Use Next.js middleware or page-level hooks to send Core Web Vitals to Application Insights (via `@microsoft/applicationinsights-web`).
2. Insert the instrumentation key via environment variables so the same Helm values control dev/prod separation.
3. Verify values arrive in the Application Insights workspace attached to the Japan East resource group.

### Step 9: Helm & CI updates
1. Add optional `logging` values (e.g., `backend.enableOtel: true`) so you can toggle exporters per environment.
2. Update `.github/workflows/deploy.yml` to fail if unit tests or linting detect missing env vars for telemetry, ensuring observability is never skipped.

### Step 10: Acceptance checklist
- [ ] Pods start without mounting inline `.env` files.
- [ ] `kubectl describe pod` shows the CSI `secrets-store-inline` volume and ServiceAccount annotations.
- [ ] Queries in Log Analytics show backend traces/metrics from dev.
- [ ] Application Insights displays frontend telemetry.
- [ ] Documentation updated (this file + `docs/azure-aks-deployment-plan.md` Phase 1 section set to complete).

Once every checkbox is true for dev, repeat for prod. After both namespaces use Key Vault + telemetry successfully, mark Phase 1 as done in the master plan.
