# Yard-managed delivery build and release

1. Add opt-in supplier coverage and estimate settings and nullable order commitment information. Apply a forward-compatible migration before deploying the application. Preserve legacy orders and profile behavior.
2. Share server-side checks for serviceable PIN codes and delivery estimates between comparison, cart quote and submission. Quote the full cart and verify the submitted quote under the supplier lock. Existing retry keys must continue to replay an already committed order.
3. Update the two customer builds with PIN entry, yard eligibility, price and estimate at review, and the committed window in order history. Keep one identified yard per cart.
4. Update both distributor builds with coverage settings, order commitments, a proposed change that requires buyer approval, and the existing vehicle and dispatch workflow. Add a read-only overdue queue for platform support.
5. Verify schema migration, server authorization and concurrency, legacy compatibility, expired or changed quotes, and the buyer and yard flows. Retain the existing bilingual controls and use test records for any write.
6. Merge with automatic production promotion paused, then promote the staged builds together after migration and verification. Smoke-test the deployed apps with read-only requests. Do not configure live yards or promise delivery until an operator enables and configures each participating supplier.

## Release configuration

- Yard PIN codes and lead times are saved in the distributor profile. The settings apply to that yard's eligible orders across its existing active service districts. The Darbhanga cement pilot is an operator rollout choice. A yard with empty coverage and lead times uses its existing district-based checkout.
- Checkout quotes expire after 15 minutes. The yard has a one-hour response target. Buyers must approve a proposed replacement window before it can become a commitment. A quote refresh preserves the original order intent for retries.
- Apply migration `202611200001_yard_delivery` using the approved direct production database connection and verify its status before promoting the staged builds. The Prisma client reads the new columns even when every pilot yard is disabled.
- Standalone Vercel previews proxy to the production API. Use a migrated isolated database and local or isolated API for end-to-end tests. In production, check the unified API deployment first, then the customer and distributor portals. No preview or production test order should be created against the live database.

## Readiness and support follow-up

- Have API readiness check the supplier delivery columns, order schedule, and quote-change table. Keep liveness independent of the database and keep internal details out of the readiness response.
- Show active proposed delivery windows awaiting buyer approval in both admin builds. Keep overdue deliveries ahead of proposals in the queue and omit terminal orders and expired proposals.
- Verify the readiness response on pre-pilot and migrated schemas. Verify the support queue with isolated orders.

## Pilot measurement follow-up

- Add a 30-day order cohort to the admin delivery overview in both builds. Use the first yard confirmation event to measure response time, and compare the recorded delivery time with both bounds of the final confirmed window.
- Count open delivery exceptions independently of the 100-order display limit. Include earlier open exceptions so support can still see the full workload.
- Verify admin authorization and sample counts against isolated orders, including late deliveries, an exact deadline, an unconfirmed order, and an order outside the 30-day cohort.

## Checkout quote-change tracking

- Sign pilot checkout tokens against the submitted yard, district, PIN code, and cart. Keep validating already-issued legacy tokens until they expire.
- When a valid pilot quote no longer matches a successfully recalculated offer, record one event per buyer and reviewed quote, then keep the existing checkout conflict and review flow. Expired tokens, invalid signatures, different carts, and offers that cannot be recalculated are outside this count.
- Show the number of changed quotes detected in the last 30 days in both admin builds. Store a deduplication digest and event time, with no quotes, addresses, or raw buyer identifiers.
- Apply the additive quote-change migration before promoting builds that read it.

## Buyer review of refreshed quotes

- On a checkout conflict, keep the quote the buyer reviewed in memory while fetching the replacement for the same cart and delivery PIN.
- Show the previous and current unit prices, materials subtotal, delivery charge, amount due, and delivery estimate when those values changed. Preserve the entered delivery details and require the buyer to place the order again.
- Verify the conflict and renewed review in English and Hindi in both marketplace builds. An identical refreshed quote needs no comparison.
