-- Migration: 005_create_audit_logs.sql
-- Description: Create audit_logs table for immutable-by-convention security audit logging.
-- Uses ON DELETE SET NULL on user_id to preserve audit history when a user account is deleted.
-- Target: PostgreSQL database safe_company_chatbot

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(80) NOT NULL,
    event_status VARCHAR(20) NOT NULL,
    resource_type VARCHAR(30),
    resource_id INTEGER,
    ip_address VARCHAR(45),
    user_agent VARCHAR(300),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id
    ON audit_logs (user_id);

CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type
    ON audit_logs (event_type);

CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at
    ON audit_logs (created_at);

CREATE INDEX IF NOT EXISTS ix_audit_logs_event_status
    ON audit_logs (event_status);

