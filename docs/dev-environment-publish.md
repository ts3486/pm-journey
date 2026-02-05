# Publishing the Dev Environment to the Internet

_Last updated: 2026-02-01_

This checklist explains exactly how to expose the `dev` deployment of pm-journey through Azure’s networking stack so teammates can open it in a browser. Because the current subscription uses the AKS Free tier (which cannot run the Application Gateway Ingress Controller), these steps rely on the NGINX Ingress Controller backed by the built-in Azure Load Balancer. All examples assume every component lives in the single resource group `pm-journey`; adjust only if you split resources later.

---

## 1. Prerequisites
- `pm-journey` Helm release already running in the `dev` namespace with healthy frontend & backend pods.
- Azure CLI logged in (`az login`) and default subscription set.
- Azure resource group: `pm-journey` (used for VNet, AKS, load balancer, Key Vault, etc.).
- Domain you control in Azure DNS (e.g., `pm-journey.com`).
- TLS certificate for the dev host (self-signed is acceptable for testing, but a real cert in Key Vault makes future promotion easier).

---

## 2. Reserve a Static Public IP for the Ingress Controller
NGINX will use Azure’s built-in load balancer. Create a Standard static IP so the DNS record stays consistent.

```bash
RG_NET=pm-journey
LOCATION=japaneast
PUBLIC_IP=pip-pm-journey-dev

az network public-ip create \
  --resource-group $RG_NET \
  --name $PUBLIC_IP \
  --sku Standard \
  --allocation-method Static
```

Record the IP address for later:
```bash
PUBLIC_IP_ADDRESS=$(az network public-ip show -g $RG_NET -n $PUBLIC_IP --query ipAddress -o tsv)
echo $PUBLIC_IP_ADDRESS
```

---

## 3. Install the NGINX Ingress Controller
1. Add the Helm repo and install NGINX into its own namespace while binding the reserved IP:
   ```bash
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm repo update

   kubectl create namespace ingress-nginx || true

   RG_FOR_LB=pm-journey    # since the public IP sits in the same group

   helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
     --namespace ingress-nginx \
     --set controller.service.loadBalancerIP=$PUBLIC_IP_ADDRESS \
     --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-resource-group"=$RG_FOR_LB
   ```
2. Wait for the load balancer to come up:
   ```bash
   kubectl get svc -n ingress-nginx ingress-nginx-controller --watch
   ```
   The EXTERNAL-IP column should show the same static IP reserved above.

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
     az account show --query "{name:name, id:id}"
  az keyvault list -g pm-journey --query "[?name=='pm-journey-dev'].id" -o tsv
   ```
4. Create Kubernetes TLS secrets from the certs (needed by the NGINX ingress):
   ```bash
   kubectl create secret tls frontend-tls \
     --cert=dev-app.crt --key=dev-app.key \
     --namespace dev

   kubectl create secret tls backend-tls \
     --cert=dev-api.crt --key=dev-api.key \
     --namespace dev
   ```

> For quick HTTP testing you can skip TLS and use plain HTTP, but add HTTPS before handing the URL to stakeholders.

---

## 5. Configure DNS
### Option A – Public DNS (default)
1. Grab the public IP:
   ```bash
   az network public-ip show -g $RG_NET -n $PUBLIC_IP --query ipAddress -o tsv
   ```
2. In Azure DNS (or your registrar) create records:
   - `app.dev.pm-journey.com` → the static ingress public IP
   - `api.dev.pm-journey.com` → same IP (if exposing backend separately)

Propagation usually takes a few minutes. Verify with:
```bash
nslookup app.dev.pm-journey.com
```

### Option B – Keep Dev Private but Share with Specific People
If you want the environment reachable only from trusted networks or individuals, use one of these patterns instead of public DNS:
- **Azure VPN Gateway / Azure Bastion / Point-to-Site VPN:** add collaborators to the VPN and tell them to hit the private IP of the ingress load balancer (or create an internal-only DNS zone such as `dev.pm-journey.private`).
- **Azure Application Proxy or Private Link Service:** expose the service privately and require Azure AD authentication before tunneling to the cluster.
- **Cloudflare Zero Trust / Tailscale / WireGuard tunnels:** run an NGINX ingress with internal IP, then publish via a secure access service that enforces SSO for invited users.

For example, to keep the ingress private:
1. Edit the NGINX service to use an internal load balancer:
   ```bash
   helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
     --namespace ingress-nginx \
     --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-internal"="true" \
     --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-internal-subnet"="sn-app-internal"
   ```
2. Ensure the subnet `sn-app-internal` is reachable only via VPN/ExpressRoute.
3. Share VPN profiles (Point-to-Site) with teammates so only they can resolve and reach `app.dev.pm-journey.local`.

---

## 6. Update Helm Values & Redeploy
1. Edit `deploy/helm/pm-journey/values.dev.yaml`:
   ```yaml
   frontend:
     ingress:
       enabled: true
       className: "nginx"
       annotations:
         kubernetes.io/ingress.class: "nginx"
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
       className: "nginx"
       annotations:
         kubernetes.io/ingress.class: "nginx"
       hosts:
         - host: "api.dev.pm-journey.com"
           paths:
             - path: /
               pathType: Prefix
   frontend:
     env:
       NEXT_PUBLIC_API_BASE: "https://api.dev.pm-journey.com"
   ```
2. Redeploy:
   ```bash
   helm upgrade --install pm-journey deploy/helm/pm-journey \
     --namespace dev \
     --values deploy/helm/pm-journey/values.dev.yaml
   ```

---

## 7. Validate End-to-End
1. `kubectl get ingress -n dev` should show the hostnames with the static EXTERNAL-IP from the NGINX service.
2. Browse to `https://app.dev.pm-journey.com` and confirm the UI loads and talks to the API.
3. Check `kubectl logs -n ingress-nginx deploy/ingress-nginx-controller` if routing fails, and review Azure Load Balancer metrics in the portal.
4. Optionally run Playwright or manual smoke tests from an external network.

---

## 8. Troubleshooting Tips
- **502/503 errors**: ensure backend health probes match `/api/health` and `/health` endpoints; for NGINX, confirm the Service selectors match the deployments and that pods are Ready.
- **DNS not resolving**: confirm the Azure DNS zone is authoritative for your domain and the registrar NS records point to Azure.
- **SSL handshake failures**: verify the certificate’s CN/SAN matches `app.dev.pm-journey.com` and that the `frontend-tls` secret contains the correct key/cert pair.
- **Ingress objects ignored**: ensure they include `kubernetes.io/ingress.class: nginx` (or set `controller.ingressClassResource.default` when installing NGINX) so the controller picks them up.

Follow these steps and the dev environment will be reachable from any browser over HTTPS while staying inside the Azure networking guardrails you’ll also reuse for production.
