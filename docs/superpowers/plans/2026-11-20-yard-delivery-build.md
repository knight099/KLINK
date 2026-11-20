# Yard-managed delivery build and release

1. Add opt-in supplier coverage and estimate settings and nullable order commitment information. Apply a forward-compatible migration before deploying the application. Preserve legacy orders and profile behavior.
2. Share server-side checks for serviceable PIN codes and delivery estimates between comparison, cart quote and submission. Quote the full cart and verify the submitted quote under the supplier lock. Existing retry keys must continue to replay an already committed order.
3. Update the two customer builds with PIN entry, yard eligibility, price and estimate at review, and the committed window in order history. Keep one identified yard per cart.
4. Update both distributor builds with coverage settings, order commitments, a proposed change that requires buyer approval, and the existing vehicle and dispatch workflow. Add a read-only overdue queue for platform support.
5. Verify schema migration, server authorization and concurrency, legacy compatibility, expired or changed quotes, and the buyer and yard flows. Retain the existing bilingual controls and use test records for any write.
6. Release together through one production merge after migration and verification. Smoke-test the deployed apps with read-only requests. Do not configure live yards or promise delivery until an operator enables and configures each participating supplier.
