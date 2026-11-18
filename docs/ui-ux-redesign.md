# KLINK redesign for customers, distributors, and admins

Redesign one journey at a time, starting with a customer placing an order on a phone. Today, the same purchase moves through “Compare Materials & Landed Rates,” “Requisition,” and “Site Requisition Cart.” The redesign will give each step a consistent name and one clear next action. All three apps will support **English and Hindi**.

## Implementation order

| Phase | What changes | How we know it works |
|---|---|---|
| **1. Shared design and language** | Build a common page header, navigation, buttons, forms, and status messages. Use readable type, generous spacing, and one prominent action per step. Put an **English / हिन्दी** switch on sign-in and inside each app. Save the selection per site. | Switching languages keeps the user on the same screen and preserves entered values. Hindi labels fit on a small phone. Buttons, form errors, and order statuses are understandable in both languages. |
| **2. Customer shopping** | Make the starting task **Find materials**. Show the delivery district with a change option, followed by search and categories. On a material page, let the buyer compare suppliers by unit price, delivery charge, and delivered total, choose a quantity, and add it to the **Cart / कार्ट**. Keep **My orders / मेरे ऑर्डर** easy to reach. | A first-time buyer can find cement, compare two suppliers, understand the price difference, and add the intended quantity to the cart in either language. |
| **3. Checkout and tracking** | Guide the buyer through **Cart → Delivery details → Review → Place order**. Keep quantities and charges editable before submission. If sign-in is needed, return the buyer to the same cart. On confirmation, show the order number, current status, and what happens next. Keep the full amount due visible until the supplier records a payment. | Going back, correcting an address, or switching languages preserves the cart. A buyer can tell whether an order was submitted, whether money was collected, and where to track delivery. |
| **4. Distributor workflow** | Open the distributor app on work needing attention, starting with new orders and upcoming deliveries. An order detail page shows the next valid action, such as **Accept order**, **Dispatch**, or **Mark delivered**. Keep inventory, pricing, and **Udhaar / उधार** directly accessible. Show payment history beside the action to record a receipt. | A distributor can take an order from acceptance to delivery, then record a payment once and verify the remaining balance. |
| **5. Admin workflow** | Replace labels such as “GMV Ops” and “Orders & Rescue” with **Overview**, **Orders**, **Suppliers**, **Customers**, and **Payments**. Lead with pending approvals and orders needing attention. Put account management and catalog maintenance in clearly named sections. Show the affected account or order before confirming a sensitive action. | An admin can approve a supplier, find an order, and trace a payment to its customer without opening unrelated screens. |

## Verification and rollout

- Implement and review each phase in its own PR and Vercel preview. Apply customer changes to both the live marketplace and the standalone marketplace build so the two stay consistent.
- Translate navigation, forms, validation, confirmations, empty states, and errors. Preserve customer-entered names, addresses, and reference numbers. Check Hindi terminology with a fluent reviewer before public rollout.
- Test each journey at 320px and 390px phone widths and on desktop, with keyboard navigation, visible focus, readable contrast, and controls that remain usable at 200% zoom.
- Use isolated test records for checkout, dispatch, payments, and admin actions. Keep the existing API contracts, role restrictions, payment safeguards, and shared login limits intact. After each release, verify the affected production site with read-only checks.
- Before calling the redesign easy to use, have a first-time user complete each role’s main task without coaching. Record where they hesitate, backtrack, or misread a price or status, and fix those points before rollout.

The first deliverable is the shared design and bilingual controls demonstrated on customer shopping. The existing demo-password cleanup and database credential rotation remain separate public-launch blockers.
