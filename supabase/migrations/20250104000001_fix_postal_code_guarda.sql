-- =========================================
-- Fix postal code mappings for all districts
-- =========================================
-- Issue: #109
-- Problem: 47 postal codes were incorrectly mapped to multiple districts.
--          This caused find_district_by_postal() to return the wrong district.
--
-- Solution: Assign each postal code to exactly one district based on
--           official CTT data and concelho (municipality) boundaries.
--
-- Key fixes:
-- - 6300, 6305, 6320: Guarda (not Castelo Branco)
-- - 4910-4990: Viana do Castelo (not Braga or Porto)
-- - 5000-5070, 5400: Vila Real (not Bragança)
-- - 3550-3690: Viseu (not Guarda)
-- - 2840, 2845: Setúbal (not Lisboa)
-- - 6050: Portalegre (not Castelo Branco)
-- - 3100, 3105: Leiria (not Coimbra)
-- - 4660, 4690: Viseu (not Porto)
-- - 7500, 7540, 7570, 7580: Setúbal (not Portalegre)
-- =========================================

-- Aveiro
UPDATE districts SET postal_prefixes = ARRAY['3750', '3800', '3810', '3830', '3840', '3850', '3860', '3870', '3880', '4505', '4520', '4535', '4540', '4550']
WHERE slug = 'aveiro';

-- Beja
UPDATE districts SET postal_prefixes = ARRAY['7700', '7750', '7780', '7800', '7830', '7860', '7870', '7875', '7880', '7885', '7920', '7940', '7960', '7970']
WHERE slug = 'beja';

-- Braga (removed 4910-4990 which belong to Viana do Castelo)
UPDATE districts SET postal_prefixes = ARRAY['4700', '4705', '4710', '4715', '4719', '4720', '4730', '4740', '4750', '4755', '4760', '4765', '4775', '4800', '4805', '4810', '4815', '4820', '4825', '4830', '4835', '4840', '4845', '4850', '4855', '4860', '4865', '4870', '4875', '4880', '4890', '4905']
WHERE slug = 'braga';

-- Bragança (removed 5000-5070, 5400 which belong to Vila Real)
UPDATE districts SET postal_prefixes = ARRAY['5085', '5090', '5100', '5110', '5120', '5130', '5140', '5150', '5155', '5160', '5180', '5200', '5210', '5220', '5225', '5230', '5300', '5320', '5335', '5340', '5350', '5355', '5360', '5370', '5385']
WHERE slug = 'braganca';

-- Castelo Branco (removed 6050 which belongs to Portalegre, 6300/6305/6320 which belong to Guarda)
UPDATE districts SET postal_prefixes = ARRAY['6000', '6005', '6030', '6040', '6060', '6100', '6110', '6120', '6150', '6160', '6185', '6200', '6215', '6225', '6230', '6250', '6260', '6270', '6280', '6290']
WHERE slug = 'castelo-branco';

-- Coimbra (removed 3100, 3105 which belong to Leiria, removed 3440 which belongs to Viseu)
UPDATE districts SET postal_prefixes = ARRAY['3000', '3020', '3025', '3030', '3040', '3045', '3050', '3060', '3070', '3080', '3090', '3130', '3140', '3150', '3200', '3220', '3230', '3240', '3250', '3260', '3270', '3280', '3300', '3305', '3320', '3330', '3350', '3360', '3400', '3405', '3420', '3430']
WHERE slug = 'coimbra';

-- Évora
UPDATE districts SET postal_prefixes = ARRAY['7000', '7005', '7040', '7050', '7080', '7090', '7100', '7150', '7160', '7170', '7200', '7220', '7250']
WHERE slug = 'evora';

-- Faro
UPDATE districts SET postal_prefixes = ARRAY['8000', '8005', '8009', '8100', '8125', '8135', '8150', '8200', '8300', '8350', '8365', '8375', '8400', '8500', '8550', '8600', '8650', '8670', '8700', '8800', '8900', '8950', '8970']
WHERE slug = 'faro';

-- Guarda (removed 3550-3690 which belong to Viseu)
UPDATE districts SET postal_prefixes = ARRAY['6300', '6305', '6320', '6350', '6355', '6360', '6370', '6400', '6420', '6430', '6440']
WHERE slug = 'guarda';

-- Leiria (added 3100, 3105 from Coimbra - Pombal area)
UPDATE districts SET postal_prefixes = ARRAY['2400', '2405', '2410', '2415', '2420', '2425', '2430', '2435', '2440', '2445', '2450', '2460', '2480', '2485', '2490', '2495', '2500', '2510', '2520', '2525', '2530', '2540', '3100', '3105']
WHERE slug = 'leiria';

-- Lisboa (removed 2840, 2845 which belong to Setúbal - Seixal)
UPDATE districts SET postal_prefixes = ARRAY['1000', '1049', '1050', '1069', '1070', '1099', '1100', '1149', '1150', '1169', '1170', '1199', '1200', '1249', '1250', '1269', '1300', '1349', '1350', '1399', '1400', '1449', '1495', '1499', '1500', '1549', '1600', '1649', '1675', '1700', '1749', '1750', '1800', '1849', '1900', '1959', '1990', '1998', '2580', '2590', '2600', '2605', '2610', '2614', '2615', '2620', '2625', '2630', '2635', '2640', '2645', '2649', '2650', '2655', '2660', '2665', '2670', '2675', '2680', '2685', '2690', '2695', '2700', '2705', '2710', '2714', '2715', '2719', '2720', '2725', '2730', '2735', '2739', '2740', '2745', '2749', '2750', '2755', '2760', '2765', '2769', '2770', '2775', '2779', '2780', '2784', '2785', '2790', '2795', '2799', '2800', '2805', '2810', '2815', '2820', '2825', '2829', '2830', '2835', '2855', '2860', '2870']
WHERE slug = 'lisboa';

-- Portalegre (added 6050 - Nisa, removed 7500, 7540, 7570, 7580 which belong to Setúbal)
UPDATE districts SET postal_prefixes = ARRAY['6050', '7300', '7320', '7330', '7340', '7350', '7370', '7400', '7430', '7440', '7450', '7460', '7470', '7480', '7550', '7595', '7600']
WHERE slug = 'portalegre';

-- Porto (removed 4660, 4690 which belong to Viseu, removed 4760, 4815-4835, 4905, 4990 which belong to Braga/Viana)
UPDATE districts SET postal_prefixes = ARRAY['4000', '4049', '4050', '4099', '4100', '4149', '4150', '4169', '4200', '4249', '4250', '4269', '4300', '4349', '4350', '4369', '4400', '4410', '4415', '4420', '4425', '4430', '4435', '4440', '4445', '4449', '4450', '4455', '4460', '4465', '4469', '4470', '4475', '4480', '4485', '4490', '4495', '4500', '4510', '4515', '4560', '4570', '4580', '4585', '4590', '4600', '4605', '4610', '4615', '4620', '4625', '4630', '4635', '4640', '4645', '4650', '4655', '4665', '4670', '4680', '4685', '4695', '4745', '4780', '4785', '4795', '4915']
WHERE slug = 'porto';

-- Santarém
UPDATE districts SET postal_prefixes = ARRAY['2000', '2005', '2025', '2030', '2035', '2040', '2050', '2060', '2065', '2070', '2080', '2090', '2100', '2120', '2125', '2130', '2135', '2140', '2150', '2154', '2200', '2205', '2230', '2240', '2250', '2260']
WHERE slug = 'santarem';

-- Setúbal (added 2840, 2845 from Lisboa - Seixal, added 7500, 7540, 7570, 7580 from Portalegre - Santiago do Cacém)
UPDATE districts SET postal_prefixes = ARRAY['2840', '2845', '2900', '2910', '2920', '2925', '2935', '2950', '2955', '2965', '2970', '2975', '7500', '7540', '7555', '7565', '7570', '7580', '7630', '7640', '7645']
WHERE slug = 'setubal';

-- Viana do Castelo (kept 4910-4990 which were incorrectly in Braga/Porto)
UPDATE districts SET postal_prefixes = ARRAY['4900', '4910', '4920', '4925', '4930', '4935', '4939', '4940', '4950', '4960', '4970', '4980', '4990']
WHERE slug = 'viana-do-castelo';

-- Vila Real (added 5000-5070, 5400 which were incorrectly in Bragança)
UPDATE districts SET postal_prefixes = ARRAY['5000', '5030', '5040', '5050', '5060', '5070', '5400', '5425', '5430', '5445', '5450', '5460', '5470']
WHERE slug = 'vila-real';

-- Viseu (added 3440, 3550-3690, 4660, 4690)
UPDATE districts SET postal_prefixes = ARRAY['3440', '3460', '3465', '3475', '3500', '3505', '3510', '3515', '3520', '3525', '3530', '3535', '3540', '3550', '3560', '3570', '3580', '3590', '3600', '3610', '3620', '3630', '3640', '3650', '3660', '3670', '3680', '3690', '3700', '3720', '3730', '4660', '4690']
WHERE slug = 'viseu';

-- Açores, Madeira, Europa, Fora da Europa - diaspora circles with no postal codes
UPDATE districts SET postal_prefixes = ARRAY[]::TEXT[] WHERE slug IN ('acores', 'madeira', 'europa', 'fora-da-europa');

-- =========================================
-- Fix postal code lookup function
-- =========================================
-- The previous fallback logic would return the "nearest" district
-- when no exact match was found. This is incorrect - if a postal
-- code isn't in our database, we should return NULL and let the
-- frontend handle the "not found" case (e.g., show district selector).

CREATE OR REPLACE FUNCTION find_district_by_postal(postal_code TEXT)
RETURNS UUID AS $$
DECLARE
  prefix TEXT;
  district_id UUID;
BEGIN
  -- Extract first 4 digits, removing any non-numeric characters
  prefix := LEFT(REGEXP_REPLACE(postal_code, '[^0-9]', '', 'g'), 4);

  -- Validate we have a 4-digit prefix
  IF LENGTH(prefix) < 4 THEN
    RETURN NULL;
  END IF;

  -- Exact match only - no fallback guessing
  SELECT id INTO district_id
  FROM districts
  WHERE prefix = ANY(postal_prefixes)
  LIMIT 1;

  -- Returns NULL if no match (correct behavior)
  -- Frontend should handle NULL by showing district selector
  RETURN district_id;
END;
$$ LANGUAGE plpgsql STABLE;
