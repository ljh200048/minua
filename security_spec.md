# Security Specification: MINUA Jewellery Store Admin Control

## 1. Data Invariants
- Products can be read by anyone (publicly accessible).
- Products can only be created, updated, or deleted by authorized administrators (specifically `lch200048@gmail.com` with email verification enabled, or a UID listed in the `/admins` collection).
- Any timestamp update must synchronize exactly with `request.time`.
- Price must be a non-negative number.

## 2. The Dirty Dozen Payloads (Intrusions to Block)
1. **Unauthenticated Creation**: Attempting to create a product from a guest browser session.
2. **Standard User Creation**: Attempting to create a product with standard user credentials (`normal_user@example.com`).
3. **Admin Email Spoofing**: Attempting to create a product with email `lch200048@gmail.com` but `email_verified: false` to force identity access.
4. **ID Poisoning Attack**: Trying to create a product with standard ID containing toxic characters or size exceeding 128 characters.
5. **Junk Field Inject (Shadow fields)**: Trying to write a new product containing extra fields not in the blueprint like `isPromoted: true`.
6. **Immutable Field Tampering**: Attempting to rewrite `createdAt` on an existing product.
7. **Negative Price Inject**: Writing a product where `price: -250` which could crash the checkout logic.
8. **Malicious Client Timestamping**: Putting a custom date in `updatedAt` instead of `request.time`.
9. **Unauthenticated Deletion**: Guests attempting to wipe out product listing.
10. **Admin Record Takeover**: Standard user attempting to create an entry under `/admins/me` with role 'admin'.
11. **Malicious Image Base64 Bloat**: Submitting excessively large text bounds (e.g. string size checks).
12. **Out of Range Price**: Submitting pricing values that are too high or negative.

## 3. Test Cases Draft
We verify that all matching writes are rejected under standard authentication.
