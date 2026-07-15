-- Schema migrations for Lab Resource Platform
-- This file runs on application startup

-- Fix bookings status CHECK constraint if it exists
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_status_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        -- Drop the old constraint
        ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
    END IF;
    
    -- Also check for any constraint with 'status' in the name
    FOR constraint_exists IN
        SELECT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname LIKE '%status%' AND conrelid = 'bookings'::regclass
        )
    LOOP
        -- Drop any status-related constraints
        EXECUTE (
            SELECT 'ALTER TABLE bookings DROP CONSTRAINT ' || conname || ';'
            FROM pg_constraint 
            WHERE conname LIKE '%status%' AND conrelid = 'bookings'::regclass
        );
    END LOOP;
END $$;

-- Add the updated CHECK constraint with all valid statuses
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
    'PENDING', 
    'CONFIRMED', 
    'REJECTED', 
    'IN_PROGRESS', 
    'WAITLISTED', 
    'CANCELLED', 
    'COMPLETED', 
    'NO_SHOW'
));

-- Fix waitlists notified column if it exists
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if the notified column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waitlists' AND column_name = 'notified'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        -- Add the column if it doesn't exist
        ALTER TABLE waitlists ADD COLUMN notified boolean NOT NULL DEFAULT false;
    ELSE
        -- Ensure notified column has proper default and is not null
        ALTER TABLE waitlists ALTER COLUMN notified SET DEFAULT false;
        ALTER TABLE waitlists ALTER COLUMN notified SET NOT NULL;
    END IF;
END $$;

-- Fix equipments added_by column type if it's varchar instead of bigint
DO $$
DECLARE
    column_type text;
BEGIN
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'equipments' AND column_name = 'added_by';
    
    -- If added_by is varchar, we need to handle it carefully
    -- Drop the column and recreate as bigint if it's stored as varchar
    IF column_type = 'character varying' OR column_type = 'varchar' THEN
        -- Check if there are any foreign key constraints
        -- First drop any existing constraints
        BEGIN
            ALTER TABLE equipments DROP CONSTRAINT IF EXISTS fk_equipments_added_by;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if constraint doesn't exist
        END;
        
        -- Rename the column instead of dropping (to preserve data if it's numeric)
        -- If the data is not numeric, this will fail and we'll need manual intervention
        BEGIN
            ALTER TABLE equipments ALTER COLUMN added_by TYPE bigint USING added_by::bigint;
        EXCEPTION WHEN OTHERS THEN
            -- If conversion fails, just set column to nullable bigint
            ALTER TABLE equipments ALTER COLUMN added_by TYPE bigint;
        END;
    END IF;
END $$;
