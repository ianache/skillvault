# Design Spec: Keycloak QA Realm Integration

## Context & Overview
The application `skillvault` (built with Next.js 16 and NextAuth v5 / Auth.js) requires single sign-on (SSO) authentication connected to Keycloak running on the QA environment for Comsatel.

- **Host**: `https://oauth2.qa.comsatel.com.pe`
- **Realm**: `Apps`
- **Client ID**: `skillvault` (configurable via environment variables)

## Architecture & Configuration

### 1. Environment Variables (`.env` and `.env.example`)
The following environment variables will configure the Keycloak OIDC provider:

| Variable | Target QA Value / Format | Description |
|---|---|---|
| `AUTH_KEYCLOAK_ISSUER` | `https://oauth2.qa.comsatel.com.pe/realms/Apps` | OIDC Issuer URL for Keycloak discovery |
| `AUTH_KEYCLOAK_ID` | `skillvault` | Client ID registered in Keycloak QA |
| `AUTH_KEYCLOAK_SECRET` | `<keycloak-client-secret>` | Client Secret from Keycloak QA |
| `AUTH_TRUST_HOST` | `true` | Required for NextAuth v5 behind proxies / dev servers |
| `AUTH_URL` | `http://localhost:3010` | Base URL of application for callback resolution |

### 2. NextAuth Configuration (`src/auth.ts`)
The `src/auth.ts` file utilizes the standard NextAuth Keycloak provider which reads `AUTH_KEYCLOAK_ISSUER`, `AUTH_KEYCLOAK_ID`, and `AUTH_KEYCLOAK_SECRET`. 

Keycloak OIDC discovery automatically resolves:
- **Authorization Endpoint**: `https://oauth2.qa.comsatel.com.pe/realms/Apps/protocol/openid-connect/auth`
- **Token Endpoint**: `https://oauth2.qa.comsatel.com.pe/realms/Apps/protocol/openid-connect/token`
- **UserInfo Endpoint**: `https://oauth2.qa.comsatel.com.pe/realms/Apps/protocol/openid-connect/userinfo`
- **JWKS URI**: `https://oauth2.qa.comsatel.com.pe/realms/Apps/protocol/openid-connect/certs`

### 3. Keycloak Client Requirements (QA Realm: `Apps`)
In the Keycloak Admin Console for realm `Apps`:
- **Client ID**: `skillvault`
- **Client Authentication**: Enabled (Confidential Client)
- **Valid Redirect URIs**: `http://localhost:3010/api/auth/callback/keycloak`
- **Web Origins**: `http://localhost:3010`

### 4. Role Mapping
NextAuth callbacks in `src/auth.ts` parse custom roles from the JWT profile claim (`roles`). No modifications to token claims parsing logic are required unless claim structure in QA realm differs.

## Verification Criteria
1. `.env` and `.env.example` contain updated `AUTH_KEYCLOAK_ISSUER` set to `https://oauth2.qa.comsatel.com.pe/realms/Apps`.
2. Initiating sign-in (`/api/auth/signin` or `/signin`) redirects successfully to `https://oauth2.qa.comsatel.com.pe/realms/Apps/protocol/openid-connect/auth`.
