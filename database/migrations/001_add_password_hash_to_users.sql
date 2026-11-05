-- Migration: 001_add_password_hash_to_users.sql
-- Description: Non-destructive, idempotent migration to add password_hash column to existing users table.
-- Explicitly disables any pre-existing legacy accounts that lacked password hashes to prevent unauthorized access.
-- Target: PostgreSQL database safe_company_chatbot

-- Step 1: Add password_hash column as nullable first to safely accommodate existing records
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Explicit disabled-account mechanism:
-- Any pre-existing rows without a password hash are marked inactive (is_active = FALSE)
-- and given an unusable shadow-locked string (!DISABLED!) so they can never be authenticated
-- until an administrator or secure password reset provisions them.
UPDATE users 
SET password_hash = '!DISABLED!ACCOUNT_REQUIRES_PASSWORD_RESET',
    is_active = FALSE
WHERE password_hash IS NULL;

-- Step 3: Enforce NOT NULL constraint now that all rows have non-null values
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
