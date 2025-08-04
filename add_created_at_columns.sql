-- Add created_at column to procedure_entries table
ALTER TABLE procedure_entries 
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

-- Add created_at column to internal_medications table
ALTER TABLE internal_medications 
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

-- Update existing records to have a created_at timestamp (optional)
-- This will set created_at to the current time for existing records
UPDATE procedure_entries 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE internal_medications 
SET created_at = NOW() 
WHERE created_at IS NULL; 