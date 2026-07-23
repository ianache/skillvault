# Helm QA Values & Ingress Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Helm chart values and Kubernetes Nginx Ingress template variables for the QA environment (`https://skillvault.qa.comsatel.com.pe`).

**Architecture:** Extend `templates/configmap.yaml` and `values.yaml` to export `AUTH_URL` and `AUTH_TRUST_HOST`, and create `values-qa.yaml` with Nginx Ingress, Cert-Manager TLS, and Keycloak QA configuration.

**Tech Stack:** Helm 3, Kubernetes, NextAuth v5, Nginx Ingress Controller, Cert-Manager.

## Global Constraints

- QA Host must be `skillvault.qa.comsatel.com.pe`.
- Ingress class must be `nginx`.
- Keycloak Issuer must be `https://oauth2.qa.comsatel.com.pe/realms/Apps`.

---

### Task 1: Update ConfigMap Template & Base Values

**Files:**
- Modify: `helm/skillvault/templates/configmap.yaml:11-13`
- Modify: `helm/skillvault/values.yaml:36-44`

**Interfaces:**
- Consumes: `.Values.auth.trustHost` and `.Values.auth.url`
- Produces: `AUTH_TRUST_HOST` and `AUTH_URL` environment variables in application pods

- [ ] **Step 1: Update `helm/skillvault/templates/configmap.yaml`**

Add `AUTH_TRUST_HOST` and `AUTH_URL` to `data` in `helm/skillvault/templates/configmap.yaml`.

```yaml
data:
  NODE_ENV: "production"
  PORT: "3000"
  HOSTNAME: "0.0.0.0"
  AUTH_KEYCLOAK_ID: {{ .Values.auth.keycloak.id | quote }}
  AUTH_KEYCLOAK_ISSUER: {{ .Values.auth.keycloak.issuer | quote }}
  AUTH_TRUST_HOST: {{ .Values.auth.trustHost | quote }}
  AUTH_URL: {{ .Values.auth.url | quote }}
```

- [ ] **Step 2: Update `helm/skillvault/values.yaml`**

Add `trustHost` and `url` fields under `auth` in `helm/skillvault/values.yaml`.

```yaml
# ── Autenticación (next-auth + Keycloak externo) ───────────────────────────────
auth:
  # AUTH_SECRET: valor aleatorio de 32 bytes, generado con `openssl rand -base64 32`
  secret: ""
  trustHost: "true"
  url: ""
  keycloak:
    id: "skillvault"
    # CLIENT SECRET de Keycloak — se almacena en Secret de Kubernetes
    secret: ""
    issuer: "https://oauth2.qa.comsatel.com.pe/realms/Apps"
```

- [ ] **Step 3: Commit ConfigMap and base values update**

```bash
git add helm/skillvault/templates/configmap.yaml helm/skillvault/values.yaml
git commit -m "feat(helm): export AUTH_URL and AUTH_TRUST_HOST in ConfigMap"
```

---

### Task 2: Create `values-qa.yaml` and Verify Helm Template Rendering

**Files:**
- Create: `helm/skillvault/values-qa.yaml`

**Interfaces:**
- Consumes: Helm values schema
- Produces: Rendered Kubernetes manifests for QA environment

- [ ] **Step 1: Create `helm/skillvault/values-qa.yaml`**

Create `helm/skillvault/values-qa.yaml` with the following content:

```yaml
# Override para entorno QA (Kubernetes + Nginx Ingress + Cert-Manager)
# Uso: helm install skillvault ./helm/skillvault -f helm/skillvault/values-qa.yaml --set auth.secret=xxx --set auth.keycloak.secret=xxx

image:
  repository: xnet/skillvault
  tag: "0.3.0"
  pullPolicy: IfNotPresent

replicaCount: 1

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-qa"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: skillvault.qa.comsatel.com.pe
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: skillvault-qa-tls
      hosts:
        - skillvault.qa.comsatel.com.pe

auth:
  trustHost: "true"
  url: "https://skillvault.qa.comsatel.com.pe"
  keycloak:
    id: "skillvault"
    issuer: "https://oauth2.qa.comsatel.com.pe/realms/Apps"

mysql:
  enabled: true
  persistence:
    enabled: true
    size: 5Gi
```

- [ ] **Step 2: Test rendering with `helm template`**

Run: `helm template test-release ./helm/skillvault -f helm/skillvault/values-qa.yaml`
Expected: Output includes Ingress resource with `host: skillvault.qa.comsatel.com.pe` and ConfigMap with `AUTH_URL: "https://skillvault.qa.comsatel.com.pe"`.

- [ ] **Step 3: Commit `values-qa.yaml`**

```bash
git add helm/skillvault/values-qa.yaml
git commit -m "feat(helm): add values-qa.yaml for QA environment with Nginx Ingress and Cert-Manager"
```
