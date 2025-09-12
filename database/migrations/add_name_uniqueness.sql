-- First, identify and handle any duplicate names in the existing data
-- Create a temporary table to store duplicate cases
CREATE TEMP TABLE duplicate_cases AS
SELECT id, first_name, last_name, ROW_NUMBER() OVER(PARTITION BY LOWER(first_name), LOWER(last_name) ORDER BY id) as row_num
FROM cases;

-- Display the duplicates for reference (optional)
SELECT c.id, c.first_name, c.last_name
FROM cases c
JOIN duplicate_cases dc ON c.id = dc.id
WHERE dc.row_num > 1;

-- Update duplicate cases to make them unique by appending a number to the last_name
UPDATE cases
SET last_name = CONCAT(last_name, ' (', (SELECT row_num FROM duplicate_cases WHERE duplicate_cases.id = cases.id), ')')
WHERE id IN (SELECT id FROM duplicate_cases WHERE row_num > 1);

-- Now add the unique constraint after handling existing duplicates
ALTER TABLE cases ADD CONSTRAINT cases_name_unique UNIQUE (first_name, last_name);

-- Add a case-insensitive index to improve query performance and enforce case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_name_unique ON cases (LOWER(first_name), LOWER(last_name));

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT cases_name_unique ON cases IS 'Ensures that each case has a unique name combination (first_name + last_name)'; 