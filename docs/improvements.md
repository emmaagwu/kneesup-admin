# Deferred Improvement: Reservation Lifecycle Status Model

## Why this is needed
- Current statuses (`Pending`, `Accepted`, `Declined`) are enough for initial host review, but not enough for full operational tracking.
- After acceptance, we still need visibility into payment completion, fulfillment, no-shows, and failures.

## Proposed direction
- Split status into two dimensions instead of one overloaded enum:

1. Decision status (host review)
- `PENDING_REVIEW`
- `ACCEPTED`
- `DECLINED`
- `CANCELLED_BY_GUEST`
- `CANCELLED_BY_HOST`

2. Fulfillment/payment status (execution)
- `PAYMENT_PENDING`
- `PAYMENT_AUTHORIZED`
- `PAYMENT_CAPTURED`
- `PAYMENT_FAILED`
- `REFUNDED_PARTIAL`
- `REFUNDED_FULL`
- `NO_SHOW`
- `COMPLETED`

## Implementation note (later)
- Keep backward compatibility by introducing a status adapter in admin pages.
- Adapter should map existing `reservationState` values to decision status first, then enrich with payment lifecycle fields when available.
- UI can show primary badge (decision) + secondary badge (payment/fulfillment).

## Expected outcome
- Better end-to-end visibility for hosts and admins.
- Cleaner conflict handling and support workflows.
- Future-proof status design without breaking current flows.
