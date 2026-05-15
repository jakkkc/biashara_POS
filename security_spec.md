# Biashara POS Security Specification

## 1. Data Invariants
- A business owner has full control over their business record and sub-resources.
- Staff access is scoped to their business and specifically their branch (if applicable).
- A transaction cannot be created without a valid businessId and branchId.
- Products belong to a specific business.
- Super Admin (jacmwaniki@gmail.com) has global read access for support.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. User A trying to read User B's business settings.
2. User A trying to create a transaction for User B's business.
3. User A trying to update the 'status' (suspended) of their own business.
4. Cashier trying to delete a transaction.
5. Manager trying to delete a staff member they didn't create (or business owner).
6. Unauthorized user trying to read /superAdmin/*
7. User trying to inject 1MB string into product SKU.
8. User trying to create a product with negative price.
9. Staff trying to update their own role to 'owner'.
10. Anonymous user trying to write any data.
11. User trying to read all businesses without being Super Admin.
12. User trying to bypass branch isolation (e.g., Cashier A reading Branch B sales).

## 3. Test Runner (Mock)
- Verification of PERMISSION_DENIED for all the above.
