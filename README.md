# Edu Connect Backend

NestJS + Prisma + MySQL backend with JWT auth, RBAC (ADMIN, TEACHER, STUDENT), and real-time chat via Socket.IO.

## Tech Stack
- NestJS (REST + WebSockets)
- Prisma ORM (MySQL)
- JWT auth (access + refresh)
- RBAC guards and decorators
- Validation with class-validator
- Swagger at `/api/docs`

## Setup
1. Copy env and configure
```
cp .env.example .env
```
Edit `.env`:
- DATABASE_URL: mysql connection string
- JWT_ACCESS_SECRET / JWT_REFRESH_SECRET: strong secrets

2. Install deps
```
npm install
```

3. Prisma
```
npx prisma generate
npx prisma migrate dev --name init
```

4. Seed demo data
```
npm run db:seed
```
Creates:
- admin@example.com / AdminPass123!
- teacher@example.com / TeacherPass123!
- student@example.com / StudentPass123!
And an assignment + example group/messages.

5. Run
```
npm run start:dev
```
Visit:
- API: http://localhost:3000/api
- Docs: http://localhost:3000/api/docs

## Auth Flow
- POST `/api/auth/login` -> { accessToken, refreshToken }
- POST `/api/auth/refresh` -> { accessToken }
- POST `/api/auth/logout` (JWT) -> { success: true }

## RBAC
- ADMIN endpoints under `/api/admin/**`
- TEACHER endpoints under `/api/teacher/**`
- STUDENT endpoints under `/api/student/**`

## Chat
- Private chat between assigned teacher/student (persisted)
- Group chat owned by teacher with members
- Read receipts via `readAt` and WS events
- REST history endpoints under `/api/chat/**`
- WebSocket events: `joinGroup`, `sendMessage`, `markPrivateRead`, `markGroupRead`, `receiveMessage`

## Testing
E2E tests (Supertest/Jest) are scaffolded under `test/`. They assume a reachable DB and optionally seeded data. Configure `.env` for test database or provide env vars to the test process. Run:
```
npm run test:e2e
```

## Scripts
- `npm run prisma:migrate` – dev migrations
- `npm run prisma:deploy` – deploy migrations
- `npm run prisma:generate` – generate client
- `npm run db:seed` – run seed (uses ts-node)
- `npm run test`, `npm run test:e2e`

## Notes
- Users are soft-deleted via `deletedAt`.
- Pagination supported with `page` and `limit` query params.
- Swagger examples added for Auth endpoints; extend similarly for others as needed.
