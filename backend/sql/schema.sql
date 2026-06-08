-- PostgreSQL schema for Swahilipot Hub Foundation Attendance System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('attachee','staff','volunteer','supervisor');
    END IF;
END$$;

-- Membership status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        CREATE TYPE membership_status AS ENUM ('active','inactive','pending');
    END IF;
END$$;

-- Members table (master list, no self-registration)
CREATE TABLE IF NOT EXISTS members (
    member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    institution TEXT,
    department TEXT,
    role member_role NOT NULL DEFAULT 'attachee',
    membership_status membership_status NOT NULL DEFAULT 'pending',
    registration_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users table (accounts used to login) - created by supervisors
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(member_id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role member_role NOT NULL DEFAULT 'attachee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role member_role,
    department TEXT,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT, -- e.g., Present, Absent, Late
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_verified BOOLEAN DEFAULT FALSE,
    attendance_type TEXT, -- e.g., checkin, checkout
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);

-- Reports table (stores generated report metadata and payload)
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    report_type TEXT NOT NULL, -- daily, weekly, monthly
    generated_by UUID REFERENCES users(user_id),
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_name TEXT,
    email TEXT,
    access_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address TEXT,
    location TEXT,
    access_status TEXT,
    reason TEXT
);

-- Seed a supervisor placeholder (optional)
-- INSERT INTO members (member_id, full_name, email, role, membership_status)
-- VALUES (uuid_generate_v4(), 'Supervisor', 'admin@example.com', 'supervisor', 'active');
