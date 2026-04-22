# RuFlo SaaS — Project Plan

> Production-grade B2B SaaS platform with Netflix-like UI, enterprise auth, and AWS deployment.

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CloudFront CDN                           │
│                    (Static assets + caching)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      ┌───────▼───────┐       ┌────────▼────────┐
      │   S3 Bucket   │       │   ALB (HTTPS)   │
      │  React SPA    │       │   /api/*        │
      └───────────────┘       └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   ECS Fargate   │
                              │   Node.js API   │
                              │   (3 tasks)     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
           ┌────────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐
           │  RDS Postgres │  │    ElastiCache │  │   Secrets   │
           │  (Multi-AZ)   │  │    (Redis)     │  │   Manager   │
           └───────────────┘  └───────────────┘  └─────────────┘
```

### Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + TypeScript + Vite        |
| UI Library  | Tailwind CSS + Headless UI          |
| State Mgmt  | Zustand                             |
| Backend     | Node.js + Express + TypeScript      |
| ORM         | Prisma                              |
| Database    | PostgreSQL 15 (AWS RDS)             |
| Cache       | Redis (ElastiCache)                 |
| Auth        | JWT + Passport.js (Google, MSFT)    |
| IaC         | AWS CDK (TypeScript)                |
| CI/CD       | GitHub Actions                      |
| Testing     | Vitest + Playwright                 |
| Containers  | Docker + ECS Fargate                |

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │────▶│  /login  │────▶│  Passport.js │────▶│  JWT     │
│          │     │  /signup  │     │  Local/OAuth  │     │  Tokens  │
└──────────┘     └──────────┘     └──────────────┘     └──────────┘
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                      ┌───────▼──────┐     ┌───────▼───────┐
                      │ Google OAuth │     │ Microsoft     │
                      │ (OIDC)      │     │ OAuth (MSAL)  │
                      └──────────────┘     └───────────────┘
```

- Access token: 15 min expiry, stored in memory
- Refresh token: 7 day expiry, httpOnly cookie
- Password hashing: bcrypt (12 rounds)

---

## Folder Structure

```
ruflo-poc/
├── docs/
│   └── PROJECT_PLAN.md
├── src/
│   ├── frontend/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── SignupForm.tsx
│   │   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   │   ├── OAuthButtons.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── TopNav.tsx
│   │   │   │   │   ├── ContentGrid.tsx
│   │   │   │   │   └── OrgSwitcher.tsx
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       └── Card.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useOrganization.ts
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Signup.tsx
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   └── Dashboard.tsx
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   └── auth.ts
│   │   │   ├── store/
│   │   │   │   ├── authStore.ts
│   │   │   │   └── orgStore.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   └── backend/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.ts
│       │   │   ├── auth.ts
│       │   │   └── env.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── user.controller.ts
│       │   │   └── org.controller.ts
│       │   ├── middleware/
│       │   │   ├── authenticate.ts
│       │   │   ├── authorize.ts
│       │   │   ├── validate.ts
│       │   │   └── errorHandler.ts
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── user.routes.ts
│       │   │   └── org.routes.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── user.service.ts
│       │   │   ├── org.service.ts
│       │   │   └── email.service.ts
│       │   ├── strategies/
│       │   │   ├── local.strategy.ts
│       │   │   ├── google.strategy.ts
│       │   │   └── microsoft.strategy.ts
│       │   ├── types/
│       │   │   └── index.ts
│       │   ├── utils/
│       │   │   ├── token.ts
│       │   │   └── validation.ts
│       │   └── app.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── Dockerfile
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── config/
│   └── docker-compose.yml
├── scripts/
│   └── setup.sh
├── infra/                    # AWS CDK (Phase 5)
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── package.json
└── README.md
```

---

## API Contracts

### Auth Endpoints

| Method | Endpoint                    | Body / Params                                    | Response                       | Auth |
|--------|-----------------------------|--------------------------------------------------|--------------------------------|------|
| POST   | `/api/auth/signup`          | `{ email, password, name, companyName }`        | `{ user, accessToken }`        | No   |
| POST   | `/api/auth/login`           | `{ email, password }`                            | `{ user, accessToken }`        | No   |
| POST   | `/api/auth/logout`          | —                                                | `{ message }`                  | Yes  |
| POST   | `/api/auth/refresh`         | — (cookie)                                       | `{ accessToken }`              | No   |
| POST   | `/api/auth/forgot-password` | `{ email }`                                      | `{ message }`                  | No   |
| POST   | `/api/auth/reset-password`  | `{ token, newPassword }`                         | `{ message }`                  | No   |
| GET    | `/api/auth/google`          | — (redirect)                                     | OAuth redirect                 | No   |
| GET    | `/api/auth/google/callback` | `?code=`                                         | `{ user, accessToken }`        | No   |
| GET    | `/api/auth/microsoft`       | — (redirect)                                     | OAuth redirect                 | No   |
| GET    | `/api/auth/microsoft/callback` | `?code=`                                      | `{ user, accessToken }`        | No   |

### User Endpoints

| Method | Endpoint              | Body / Params       | Response          | Auth |
|--------|-----------------------|---------------------|-------------------|------|
| GET    | `/api/users/me`       | —                   | `{ user }`        | Yes  |
| PATCH  | `/api/users/me`       | `{ name, avatar }`  | `{ user }`        | Yes  |
| DELETE | `/api/users/me`       | —                   | `{ message }`     | Yes  |

### Organization Endpoints

| Method | Endpoint                        | Body / Params                     | Response             | Auth  |
|--------|---------------------------------|-----------------------------------|----------------------|-------|
| POST   | `/api/orgs`                     | `{ name, domain }`               | `{ org }`            | Yes   |
| GET    | `/api/orgs/:id`                 | —                                 | `{ org }`            | Yes   |
| PATCH  | `/api/orgs/:id`                 | `{ name, settings }`             | `{ org }`            | Admin |
| POST   | `/api/orgs/:id/invite`          | `{ email, role }`                | `{ invite }`         | Admin |
| GET    | `/api/orgs/:id/members`         | `?page=&limit=`                  | `{ members, total }` | Yes   |
| PATCH  | `/api/orgs/:id/members/:userId` | `{ role }`                       | `{ member }`         | Admin |
| DELETE | `/api/orgs/:id/members/:userId` | —                                 | `{ message }`        | Admin |

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

---

## Database Schema

```sql
-- Organizations
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    domain          VARCHAR(255),
    logo_url        TEXT,
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),            -- NULL for OAuth-only users
    name            VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    email_verified  BOOLEAN DEFAULT FALSE,
    provider        VARCHAR(50) DEFAULT 'local',  -- local | google | microsoft
    provider_id     VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Memberships
CREATE TABLE org_memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',  -- owner | admin | member
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

-- Invitations
CREATE TABLE invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',
    token           VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    invited_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON org_memberships(org_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

## Milestones

### Phase 1: Architecture & Plan
- ✅ System architecture design
- ✅ Folder structure
- ✅ API contracts
- ✅ Database schema
- ✅ PROJECT_PLAN.md created and pushed

### Phase 2: Development
- ⏳ Backend: Project setup (Express + TypeScript + Prisma)
- ⏳ Backend: Auth endpoints (local + OAuth)
- ⏳ Backend: User & Organization APIs
- ⏳ Frontend: Project setup (React + Vite + Tailwind)
- ⏳ Frontend: Auth pages (Login, Signup, Forgot Password)
- ⏳ Frontend: Dashboard (Netflix-like layout)
- ⏳ Frontend: Organization management

### Phase 3: Testing
- ⏳ Unit tests (services, utils)
- ⏳ Integration tests (API routes)
- ⏳ E2E tests (Playwright)

### Phase 4: Test Loop
- ⏳ Run all tests
- ⏳ Fix failures
- ⏳ 100% pass rate

### Phase 5: AWS Infrastructure
- ⏳ CDK stack: VPC + Networking
- ⏳ CDK stack: RDS PostgreSQL
- ⏳ CDK stack: ECS Fargate
- ⏳ CDK stack: ALB + CloudFront + S3
- ⏳ CDK stack: Secrets Manager

### Phase 6: CI/CD
- ⏳ GitHub Actions: test on push
- ⏳ GitHub Actions: build + deploy on merge
- ⏳ Docker images + ECR
- ⏳ CloudFront invalidation

### Phase 7: PR Creation
- ⏳ Final PR with full summary

---

## Progress Tracking

| Date       | Action                           | Status |
|-----------|----------------------------------|--------|
| 2026-04-22 | Phase 1: Architecture & Plan    | ✅     |

---

## Known Issues

_None yet._

---

## Decisions Log

| Date       | Decision                                           | Rationale                                      |
|-----------|----------------------------------------------------|-------------------------------------------------|
| 2026-04-22 | React + Vite over Next.js                          | SPA is sufficient; no SSR needed for B2B dashboard |
| 2026-04-22 | Zustand over Redux                                 | Lighter, less boilerplate for this scope        |
| 2026-04-22 | Prisma over TypeORM                                | Better TypeScript integration, schema-first     |
| 2026-04-22 | JWT (access+refresh) over sessions                 | Stateless API, scales with ECS                  |
| 2026-04-22 | AWS CDK over Terraform                             | TypeScript consistency across the stack         |
| 2026-04-22 | Tailwind over styled-components                    | Faster iteration, Netflix-like dark theme       |
