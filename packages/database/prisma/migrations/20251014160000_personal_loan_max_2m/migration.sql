-- Raise personal micro loan maximum principal to ₦2,000,000
UPDATE "loan_products"
SET "maxAmount" = 2000000
WHERE "code" = 'PERS-001';
