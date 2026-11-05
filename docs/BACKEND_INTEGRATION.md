# Backend integration guide

This demo implements hospital CRM behavior in **`src/lib/mock/repository.ts`** with in-memory state. Production should replace the mock adapter with HTTP (or RPC) calls to a real backend while keeping the same business rules.

## Repository → API mapping (suggested)

| Mock operation | Suggested REST endpoint | Notes |
|----------------|-------------------------|--------|
| `listDoctors` / `getDoctor` | `GET /doctors`, `GET /doctors/:id` | Public or staff-scoped catalog |
| `getDoctorServices` | `GET /doctors/:id/services` | Duration, fee, buffers |
| `getAvailableSlots` | `GET /availability?doctorId&serviceId&date` | Server computes slots from schedules + holds |
| `createReservation` | `POST /appointments/reservations` | **Atomic** slot lock + idempotency key (`clientRequestId`) |
| `getAppointments` / `getAppointment` | `GET /appointments` | Filter by `doctorId`, date, status; enforce row-level auth |
| `recordVerifiedPayment` | `POST /appointments/:id/payments/verify` | Requires `verify_payment`; updates confirmation |
| `createPaymentClaim` | `POST /appointments/:id/payment-claims` | Does not confirm booking |
| `rescheduleAppointment` | `PATCH /appointments/:id/schedule` | Re-check slot atomically |
| `cancelAppointment` | `POST /appointments/:id/cancel` | Refund review flags server-side |
| `updateArrivalStatus` | `PATCH /appointments/:id/arrival` | Doctor/staff scoped |
| `getCallbacks` / `updateCallbackStatus` | `GET/PATCH /callbacks/:id` | No side effects on payment state |
| `getNotifications` / `retryNotification` | `GET/POST /notifications` | Outbound provider integration |
| `updateSettings` | `PATCH /settings/hospital` | Admin only |
| `reconcileExpiredReservations` | **Scheduled job** (cron/worker) | Not reliable from browser timers alone |

Pure helpers (`src/lib/mock/slots.ts`, `src/lib/mock/expiry.ts`, `src/lib/money.ts`) should either be duplicated on the server or shared via a published package — **the server must be the source of truth** for slot and expiry rules.

## Server-side requirements

### Atomic booking

- Reserve a slot in a **single transaction** (check overlap, insert hold, set `expiresAt`).
- Use **`clientRequestId`** (or Idempotency-Key header) so retries return the same reservation, not a duplicate.

### Concurrent updates

- Two clients booking the same slot must produce **one winner**; use row locks, compare-and-swap on slot version, or serializable isolation.
- Reschedule and post-expiry payment verification must **re-check** slot availability against current holds and confirmed appointments.

### Payment permissions

- Only roles with **`verify_payment`** may call verify endpoints (reception/admin — not doctors in this demo).
- **Claims** are intake only; confirmation requires verified ledger entries and the 50% rule (`meetsHalfThreshold` in `src/lib/money.ts`).

### Scheduled expiry

- Run `reconcileExpiredReservations` (or equivalent) on a **schedule** in the hospital timezone (**Asia/Karachi**).
- Frontend timers and demo clock offsets are for UX only; they must not be the only expiry mechanism.

### Real authentication & authorization

- Replace demo passwords with identity provider / sessions issued by the server.
- Enforce permissions on **every** mutating endpoint; never trust role checks from the browser alone.

### Audit integrity

- Append-only **activity/audit log** on the server for payments, status changes, and settings.
- Demo `activityEvents` are not tamper-evident.

### Secrets

- No API keys, webhooks, or provider credentials in the frontend bundle.
- SMS/WhatsApp/email gateways and payment processors live server-side.

## AI guardrails (enforce server-side)

When adding AI assistants to this CRM, backend policy should:

1. **Never** confirm appointments or mark payments verified without a human-permitted tool call tied to an authenticated staff session.
2. **Never** expose other patients’ PHI beyond the caller’s verified identity and need-to-know scope.
3. **Refuse** to bypass payment thresholds, expiry, or slot overlap rules — surface “staff action required” instead.
4. **Log** all AI-initiated actions with actor, prompt hash, and outcome for audit.
5. **Rate-limit** and validate structured outputs (doctor IDs, slot times) against live availability APIs, not stale context.
6. **Do not** store demo credentials or production secrets in prompts or client-visible config.

## Currency and locale

- Store money as **integer paisa**; display PKR in UI.
- Schedule and expiry boundaries in **Asia/Karachi** unless the hospital configures otherwise in settings.
