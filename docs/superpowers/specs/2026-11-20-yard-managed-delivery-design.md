# KLINK yard-managed delivery pilot

## Purpose

Help a Darbhanga buyer compare the delivered price and availability of the same cement product from participating yards. The buyer chooses one named yard per order. The yard owns stock, pricing, the delivery commitment, vehicle assignment, unloading terms, and fulfillment. KLINK owns the comparison, order record, tracking, and escalation experience.

## Operating model

The selected model is yard-managed delivery. A shared fleet or KLINK-arranged trips could expand delivery coverage but would require KLINK to manage capacity, carrier pricing, and missed trips. The pilot uses the existing yard dispatch and delivery workflows.

## Buyer journey

1. Choose a delivery PIN code and the exact cement grade, bag size, and quantity. Compare eligible yard offers using the same unit. Show the supplier's name, unit price, minimum quantity, delivery charge, delivered total, and estimated window when the supplier has provided one.
2. Keep one yard per checkout. Validate the chosen offer against the full cart and site at submission. If the price, fee, or window materially changes, display the changes and ask the buyer to review again.
3. Show the order as awaiting the yard's confirmation until it accepts. At acceptance, reserve stock using the existing transaction and record the yard's committed delivery window. A yard unable to make the requested window can propose another for the buyer to approve.
4. Show confirmed window, dispatch, delivery, and any change on the existing order screen. Include the yard's vehicle details when dispatched. If a yard declines or misses its response deadline, offer an explicit path to compare alternatives. A switch requires the buyer's choice.

## Yard and support workflow

Participating yards configure eligible PIN codes and their operating hours, delivery fees, and available windows. Start with manually maintained windows and existing stock controls. Show the yard which orders need confirmation, dispatch, or a revised window. Record who changed a commitment and when.

KLINK support can see unaccepted orders, stockouts, revised windows, and late orders. Reuse the existing order and payment safeguards. Payment receipt is recorded separately from delivery or dispatch. Orders placed before the pilot remain readable without a delivery window.

## First implementation slice

Add yard-managed PIN coverage and estimated delivery windows for pilot offers, then carry the chosen offer into checkout. Follow with commitment at acceptance and buyer-visible delivery updates. Use supplier eligibility and existing supplier locks on the server. Keep unknown coverage or timing explicit and keep the rollout limited to configured yards. Start with English and Hindi in both marketplace builds and both distributor builds.

Exercise PIN code eligibility, competing orders against limited stock, quote changes, an expired offer, a yard that declines, and a revised window with isolated test records. Verify buyers see the same yard and terms from comparison through tracking. Measure quote changes at checkout, acceptance time, on-time delivery against the committed window, and orders requiring support before extending the pilot.

## Decisions for review

Yard-owned delivery is confirmed. The proposed pilot uses cement in Darbhanga, one yard per order, and supplier estimates before an accepted commitment. Those implementation choices are for review.
