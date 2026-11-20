# Yard-managed delivery build and release

1. Add opt-in supplier coverage and estimate settings and nullable order commitment information. Apply a forward-compatible migration before deploying the application. Preserve legacy orders and profile behavior.
2. Share server-side checks for serviceable PIN codes and delivery estimates between comparison, cart quote and submission. Quote the full cart and verify the submitted quote under the supplier lock. Existing retry keys must continue to replay an already committed order.
3. Update the two customer builds with PIN entry, yard eligibility, price and estimate at review, and the committed window in order history. Keep one identified yard per cart.
4. Update both distributor builds with coverage settings, order commitments, a proposed change that requires buyer approval, and the existing vehicle and dispatch workflow. Add a read-only overdue queue for platform support.
5. Verify schema migration, server authorization and concurrency, legacy compatibility, expired or changed quotes, and the buyer and yard flows. Retain the existing bilingual controls and use test records for any write.
6. Release together through one production merge after migration and verification. Smoke-test the deployed apps with read-only requests. Do not configure live yards or promise delivery until an operator enables and configures each participating supplier.

## Release configuration

- Yard PIN codes and lead times are saved in the distributor profile. The settings apply to that yard's eligible orders across its existing active service districts. The Darbhanga cement pilot is an operator rollout choice. A yard with empty coverage and lead times uses its existing district-based checkout.
- Checkout quotes expire after 15 minutes. The yard has a one-hour response target. Buyers must approve a proposed replacement window before it can become a commitment. A quote refresh preserves the original order intent for retries.
- Apply migration `202611200001_yard_delivery` using the approved direct production database connection and verify its status before merging. The Prisma client reads the new columns even when every pilot yard is disabled.
- Standalone Vercel previews proxy to the production API. Use a migrated isolated database and local or isolated API for end-to-end tests. In production, check the unified API deployment first, then the customer and distributor portals. No preview or production test order should be created against the live database.
