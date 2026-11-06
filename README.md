# Life Care International Hospital CRM (Demo)

Frontend demonstration of a hospital CRM for **Life Care International Hospital, Islamabad**. It showcases appointment booking, payment verification workflows, doctor schedules, callbacks, and admin tooling using **fictional demo data** stored in the browser.

All times and calendars use **Asia/Karachi**. Fees are stored and displayed in **PKR** (amounts internally use integer paisa).

## Demo disclaimer

- **Fictional data only** — patients, doctors, payments, and notifications are simulated.
- **Not secure authentication** — demo login and role checks exist for UX only. Anyone can inspect or alter client-side state.
- **Production requires server-side authorization**, real identity, audit trails, and protected APIs. See [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md).

## Requirements

- Node.js **20+**
- npm

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell: `Copy-Item .env.example .env`

Open [http://localhost:3000](http://localhost:3000).

Demo usernames/passwords live in `.env` (`NEXT_PUBLIC_DEMO_*`). Copy from `.env.example` and keep `.env` out of git. These are **demo-only** values embedded in the client bundle — not production secrets.

## Scripts

| Script        | Description                          |
|---------------|--------------------------------------|
| `npm run dev` | Start Next.js dev server             |
| `npm run build` | Production build                   |
| `npm run start` | Run production server              |
| `npm run lint` | ESLint                            |
| `npm run typecheck` | TypeScript (`tsc --noEmit`)   |
| `npm run test` | Vitest (unit tests, once)          |
| `npm run test:watch` | Vitest watch mode            |

## Demo credentials

| Username         | Password       | Role      | Notes                          |
|------------------|----------------|-----------|--------------------------------|
| `admin`          | `admin123`     | Admin     | Full demo permissions          |
| `doctor.taimur`  | `doctor123`    | Doctor    | Dr. Muhammad Taimur (cardiology) |
| `doctor.khan`    | `doctor123`    | Doctor    | Dr. Imran Khan (orthopedics)   |
| `reception.sara` | `reception123` | Reception | AI inbound-calls monitor (view-only) |

Additional doctor accounts exist in seed data for schedule views; only the accounts above are on the login screen.

## Core workflows

1. **Inbound AI call (Reception)** — Reception monitors simulated inbound calls (including those without bookings), transcripts, summaries, and statuses — **no** confirm/cancel/reschedule/payment actions.
2. **Book** — Admin creates a provisional reservation → **awaiting payment** with a time-limited hold (AI may also seed provisional holds).
3. **Pay (claim)** — A payment *claim* may be submitted; claims do **not** confirm the appointment.
4. **Verify ≥ 50%** — **Admin** (`verify_payment`) records **verified** payment. When verified total meets the **50% threshold**, the booking is **confirmed** and the expiry timer is cleared.
5. **Expiry** — Unpaid holds expire; partial verified amounts may require manual resolution.
6. **Arrival** — Doctors see **confirmed** queue only and update arrival/consultation status.

Domain logic lives under `src/lib/` (mock repository, slots, expiry, money, auth helpers). Tests cover these rules in `src/**/*.test.ts`.

## Deploy on Vercel

1. Push this repository to GitHub (or import from your machine).
2. In [Vercel](https://vercel.com/new), **Import** the repository.
3. Framework preset: **Next.js** (default).
4. Optionally set the `NEXT_PUBLIC_DEMO_*` variables from `.env.example` in the Vercel project settings (demo credentials only).
5. Deploy; optional: set `NODE_VERSION` to `20` in project settings if needed.

## Documentation

- [Backend integration map](docs/BACKEND_INTEGRATION.md) — how mock operations should map to real APIs and what must run on the server.
