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
