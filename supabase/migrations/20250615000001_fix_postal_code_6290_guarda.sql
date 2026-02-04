-- =========================================
-- Move postal code 6290 from Castelo Branco to Guarda
-- =========================================
-- Issue: PR #227
-- Problem: CP4 6290 (Gouveia) was incorrectly assigned to Castelo Branco
--          in migration 20250104000001. It belongs to Guarda district.
--
-- Solution: Remove 6290 from Castelo Branco and add it to Guarda.
-- =========================================

-- Remove 6290 from Castelo Branco
UPDATE districts
SET postal_prefixes = array_remove(postal_prefixes, '6290')
WHERE slug = 'castelo-branco';

-- Add 6290 to Guarda (if not already present)
UPDATE districts
SET postal_prefixes = array_append(postal_prefixes, '6290')
WHERE slug = 'guarda'
  AND NOT ('6290' = ANY(postal_prefixes));
