-- =========================================
-- Fix postal code mappings for Aveiro municipalities
-- =========================================
-- Issue: #116
-- Problem: Postal codes 3700, 3720, 3730 were incorrectly mapped to Viseu.
--          These belong to Aveiro district and electoral circle:
--          - 3700: São João da Madeira
--          - 3720: Oliveira de Azeméis
--          - 3730: Vale de Cambra
--
-- Solution: Move 3700, 3720, 3730 from Viseu to Aveiro.
-- =========================================

-- Add 3700, 3720, 3730 to Aveiro
UPDATE districts SET postal_prefixes = ARRAY['3700', '3720', '3730', '3750', '3800', '3810', '3830', '3840', '3850', '3860', '3870', '3880', '4500', '4505', '4520', '4535', '4540', '4550']
WHERE slug = 'aveiro';

-- Remove 3700, 3720, 3730 from Viseu
UPDATE districts SET postal_prefixes = ARRAY['3440', '3460', '3465', '3475', '3500', '3505', '3510', '3515', '3520', '3525', '3530', '3535', '3540', '3550', '3560', '3570', '3580', '3590', '3600', '3610', '3620', '3630', '3640', '3650', '3660', '3670', '3680', '3690', '4660', '4690']
WHERE slug = 'viseu';
