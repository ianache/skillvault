# Design Spec: Helm Values & Ingress Configuration for QA

## Context & Overview
The application `skillvault` is deployed via Helm to a Kubernetes cluster running Nginx Ingress Controller and Cert-Manager for TLS certificate issuance.

- **Host**: `https://skillvault.qa.comsatel.com.pe`
- **Ingress Controller**: `nginx`
- **TLS Issuer**: Cert-Manager (`cert-manager.io/cluster-issuer`)
- **Keycloak Issuer**: `https://oauth2.qa.comsatel.com.pe/realms/Apps`
- **NextAuth Base URL**: `https://skillvault.qa.comsatel.com.pe`

## Architecture & Configuration

### 1. Template ConfigMap Update (`helm/skillvault/templates/configmap.yaml`)
Inject `AUTH_URL` and `AUTH_TRUST_HOST` into the application container environment via ConfigMap:

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

### 2. Base Values Update (`helm/skillvault/values.yaml`)
Add `auth.trustHost` and `auth.url` to the base `values.yaml` schema defaults.

### 3. Environment QA Values (`helm/skillvault/values-qa.yaml`)
Create `values-qa.yaml` with the following configuration:
- Ingress enabled with `ingressClassName: nginx`
- Ingress host `skillvault.qa.comsatel.com.pe`
- Ingress TLS section with secret `skillvault-qa-tls`
- Cert-manager cluster issuer annotation
- Auth URL set to `https://skillvault.qa.comsatel.com.pe`
- Keycloak issuer set to `https://oauth2.qa.comsatel.com.pe/realms/Apps`

## Verification Criteria
1. `helm template skillvault ./helm/skillvault -f helm/skillvault/values-qa.yaml` renders cleanly without errors.
2. Rendered `Ingress` contains `host: skillvault.qa.comsatel.com.pe` and `ingressClassName: nginx`.
3. Rendered `ConfigMap` contains `AUTH_URL: "https://skillvault.qa.comsatel.com.pe"` and `AUTH_TRUST_HOST: "true"`.
