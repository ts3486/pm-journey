# Publishing the Dev Environment to the Internet

_Last updated: 2026-02-01_

This checklist explains exactly how to expose the `dev` deployment of pm-journey through Azure’s networking stack so teammates can open it in a browser. It covers Application Gateway + Web Application Firewall (WAF), DNS, certificates, and Helm updates. All examples below assume every component lives in the single resource group `pm-journey`; adjust only if you split resources later.

---

## 1. Prerequisites
- `pm-journey` Helm release already running in the `dev` namespace with healthy frontend & backend pods.
- Azure CLI logged in (`az login`) and default subscription set.
- Azure resource group: `pm-journey` (used for VNet, AKS, Application Gateway, Key Vault, etc.).
- Domain you control in Azure DNS (e.g., `pm-journey.com`).
- TLS certificate for the dev host (self-signed is acceptable for testing, but a real cert in Key Vault makes future promotion easier).

---

## 2. Provision a Public Application Gateway (WAF v2)
If you already run Azure Front Door + App Gateway for prod, you can reuse that gateway and add a dev listener. Otherwise:

```bash
RG_NET=pm-journey
LOCATION=japaneast
VNET_NAME=vnet-pmjourney-je
SUBNET_APPGW=sn-appgw-dev
APPGW_NAME=agw-pmjourney-dev
PUBLIC_IP=pip-pmjourney-dev

# Create subnet (skip if it exists)
az network vnet subnet create \
  --resource-group $RG_NET \
  --vnet-name $VNET_NAME \
  --name $SUBNET_APPGW \
  --address-prefixes 10.20.32.0/23

# Create public IP for the gateway
az network public-ip create \
  --resource-group $RG_NET \
  --name $PUBLIC_IP \
  --sku Standard \
  --allocation-method Static

# Deploy Application Gateway (basic listener + backend pool placeholder)
az network application-gateway create \
  --resource-group $RG_NET \
  --name $APPGW_NAME \
  --sku WAF_v2 \
  --capacity 2 \
  --frontend-port 443 \
  --http-settings-cookie-based-affinity Disabled \
  --frontend-ip-name appGatewayFrontendIP \
  --frontend-port-name appGatewayFrontendPort \
  --public-ip-address $PUBLIC_IP \
  --vnet-name $VNET_NAME \
  --subnet $SUBNET_APPGW \
  --waf-policy WAFDefaultPolicy \
  --priority 100
```

> **Portal alternative:** Azure Portal → Application Gateways → Create → choose WAF v2, associate with the dev subnet, and select “HTTPS” listener.

---

## 3. Install/Configure the Application Gateway Ingress Controller (AGIC)
1. Enable the AGIC add-on so Application Gateway can route to AKS (still inside `pm-journey`):
   ```bash
   RG_AKS=pm-journey
   AKS_NAME=aks-pmjourney-dev
   AGIC_IDENTITY=id-agic-dev

   # Optionally create a managed identity for AGIC
   az identity create -g $RG_AKS -n $AGIC_IDENTITY

   # Grant the identity access to modify the gateway
   az role assignment create \
     --assignee $(az identity show -g $RG_AKS -n $AGIC_IDENTITY --query principalId -o tsv) \
     --role "Contributor" \
     --scope $(az network application-gateway show -g $RG_NET -n $APPGW_NAME --query id -o tsv)

   # Enable the add-on
   az aks enable-addons \
     --resource-group $RG_AKS \
     --name $AKS_NAME \
     --addons ingress-appgw \
     --appgw-id $(az network application-gateway show -g $RG_NET -n $APPGW_NAME --query id -o tsv) \
     --appgw-identity-id $(az identity show -g $RG_AKS -n $AGIC_IDENTITY --query id -o tsv)
   ```
2. Confirm the `ingress-appgw` pod is running:
   ```bash
   kubectl get pods -n kube-system | grep ingress-appgw
   ```

---

## 4. Issue/Upload a TLS Certificate (Optional for Dev)
1. **Option A – Quick self-signed cert (OpenSSL):**
   ```bash
   DEV_DOMAIN=app.dev.pm-journey.com
   openssl req -x509 -nodes -days 365 \
     -newkey rsa:2048 \
     -keyout dev-app.key \
     -out dev-app.crt \
     -subj "/CN=${DEV_DOMAIN}/O=pm-journey"
   # Repeat for api.dev.pm-journey.com if exposing backend separately.
   ```
2. **Option B – Let Key Vault mint a certificate** (uses Azure-managed CA; good for future automation):
   ```bash
   KEYVAULT_NAME=pm-journey-dev
   CERT_NAME=dev-app-cert
   DEV_DOMAIN=app.dev.pm-journey.com

   az keyvault certificate create \
     --vault-name $KEYVAULT_NAME \
     --name $CERT_NAME \
     --policy "$(az keyvault certificate get-default-policy | jq '.subject=\"CN='\"${DEV_DOMAIN}\"'\"\"')"
   ```
3. **Import an existing certificate** (if you already have a PFX from your CA):
   ```bash
   KEYVAULT_NAME=pm-journey-dev
   CERT_NAME=dev-app-cert

   az keyvault certificate import \
     --vault-name $KEYVAULT_NAME \
     --name $CERT_NAME \
     --file dev-app.pfx \
     --password <pfx-password>
   ```
4. Bind the cert to Application Gateway in the portal (App Gateway → Listeners → HTTPS listener → choose “Key Vault certificate”).

> For quick HTTP testing you can leave TLS off, but add HTTPS before handing the URL to stakeholders.

---

## 5. Configure DNS
1. Grab the public IP:
   ```bash
   az network public-ip show -g $RG_NET -n $PUBLIC_IP --query ipAddress -o tsv
   ```
2. In Azure DNS (or your registrar) create records:
   - `app.dev.pm-journey.com` → Application Gateway public IP
   - `api.dev.pm-journey.com` → same IP (if exposing backend separately)

Propagation usually takes a few minutes. Verify with:
```bash
nslookup app.dev.pm-journey.com
```

---

## 6. Update Helm Values & Redeploy
1. Edit `deploy/helm/pm-journey/values.dev.yaml`:
   ```yaml
   frontend:
     ingress:
       enabled: true
       className: "azure-application-gateway"
       hosts:
         - host: "app.dev.pm-journey.com"
           paths:
             - path: /
               pathType: Prefix
       tls:
         - secretName: frontend-tls
           hosts:
             - "app.dev.pm-journey.com"
   backend:
     ingress:
       enabled: true
       className: "azure-application-gateway"
       hosts:
         - host: "api.dev.pm-journey.com"
           paths:
             - path: /
               pathType: Prefix
   frontend:
     env:
       NEXT_PUBLIC_API_BASE: "https://api.dev.pm-journey.com"
   ```
2. Create Kubernetes TLS secrets (if not using Key Vault certificates directly):
   ```bash
   kubectl create secret tls frontend-tls \
     --cert=dev-app.crt --key=dev-app.key \
     --namespace dev

   kubectl create secret tls backend-tls \
     --cert=dev-api.crt --key=dev-api.key \
     --namespace dev
   ```
3. Redeploy:
   ```bash
   helm upgrade --install pm-journey deploy/helm/pm-journey \
     --namespace dev \
     --values deploy/helm/pm-journey/values.dev.yaml
   ```

---

## 7. Validate End-to-End
1. `kubectl get ingress -n dev` should show the Application Gateway addresses.
2. Browse to `https://app.dev.pm-journey.com` and confirm the UI loads and talks to the API.
3. Check Application Gateway → Monitoring → Access logs for traffic.
4. Optionally run Playwright or manual smoke tests from an external network.

---

## 8. Troubleshooting Tips
- **502/503 errors**: ensure backend health probes match `/api/health` and `/health` endpoints; set probe host headers to the service DNS (e.g., `pm-journey-frontend.dev.svc.cluster.local`).
- **DNS not resolving**: confirm the Azure DNS zone is authoritative for your domain and the registrar NS records point to Azure.
- **SSL handshake failures**: verify the certificate’s CN/SAN matches `app.dev.pm-journey.com` and that Application Gateway is using the Key Vault certificate.
- **AGIC not creating listeners**: check the ingress annotations (`kubernetes.io/ingress.class: azure/application-gateway`). Logs live in the `ingress-appgw` pod.

Follow these steps and the dev environment will be reachable from any browser over HTTPS while staying inside the Azure networking guardrails you’ll also reuse for production.
