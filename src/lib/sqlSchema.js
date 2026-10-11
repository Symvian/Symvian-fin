// Comprehensive PostgreSQL Schema & Supabase DDL Migration Script
// Strictly aligns with active lowercase database schema: users, event, registration, payment, venue, category, event_volunteer

export const FULL_POSTGRES_SCHEMA = `-- ============================================================================
-- SYMVIAN: Event & Venue Management System
-- Active PostgreSQL / Supabase Schema (Lowercase Tables & Columns)
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. users TABLE
-- Manages distinct user roles: Attendee, Organizer, Volunteer, Admin
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(25),
    role VARCHAR(30) NOT NULL CHECK (role IN ('Attendee', 'Organizer', 'Volunteer', 'Admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    password VARCHAR(255) NOT NULL DEFAULT 'password123',
    admin_event_ids INTEGER[] DEFAULT '{}'
);

-- ----------------------------------------------------------------------------
-- 2. venue TABLE
-- Stores physical spaces and structural capacities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venue (
    venue_id SERIAL PRIMARY KEY,
    venue_name VARCHAR(200) NOT NULL,
    location_address TEXT NOT NULL,
    total_capacity INTEGER NOT NULL CHECK (total_capacity > 0),
    contact_email VARCHAR(255) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. category TABLE
-- Classifies events (Technical, Cultural, Workshop, Hackathon, Symposium)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------------------
-- 4. event TABLE
-- Central entity linking categories, venues, and organizers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES category(category_id) ON DELETE RESTRICT,
    venue_id INTEGER NOT NULL REFERENCES venue(venue_id) ON DELETE RESTRICT,
    organizer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    event_date TIMESTAMPTZ NOT NULL,
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (ticket_price >= 0),
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    current_enrolled INTEGER NOT NULL DEFAULT 0 CHECK (current_enrolled >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    upi_id VARCHAR(100),
    admin_contact VARCHAR(25)
);

-- ----------------------------------------------------------------------------
-- 5. registration TABLE
-- Handles atomic registrations, status transitions, and dynamic waitlisting
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registration (
    registration_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    registration_status VARCHAR(30) NOT NULL CHECK (registration_status IN ('Enrolled', 'Waitlisted', 'Pending_Payment', 'Cancelled', 'Rejected')),
    waitlist_position INTEGER CHECK (waitlist_position IS NULL OR waitlist_position > 0),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    cancelled_by_contact VARCHAR(25),
    notification_read BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_event_user_registration UNIQUE (event_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 6. payment TABLE
-- Enforces payment settlements for paid event registrations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment (
    payment_id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL UNIQUE REFERENCES registration(registration_id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Verified', 'Failed', 'Refunded')),
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    verified_at TIMESTAMPTZ,
    verified_by INTEGER REFERENCES users(user_id)
);

-- ----------------------------------------------------------------------------
-- 7. event_volunteer TABLE
-- Resolves M:N relationship between Volunteers and Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_volunteer (
    assignment_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_role VARCHAR(100) NOT NULL,
    CONSTRAINT uq_event_volunteer UNIQUE (event_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE & CONSTRAINTS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_reg_event_status ON registration(event_id, registration_status);
CREATE INDEX IF NOT EXISTS idx_reg_waitlist_pos ON registration(event_id, waitlist_position);
CREATE INDEX IF NOT EXISTS idx_event_date ON event(event_date);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(payment_status);

-- ============================================================================
-- STORED PROCEDURE: CREATE EVENT WITH CO-ADMINS
-- ============================================================================
CREATE OR REPLACE FUNCTION create_event_with_admins(
    p_title VARCHAR,
    p_description TEXT,
    p_category_id INTEGER,
    p_venue_id INTEGER,
    p_organizer_id INTEGER,
    p_upi_id VARCHAR,
    p_admin_contact VARCHAR,
    p_event_date TIMESTAMPTZ,
    p_ticket_price NUMERIC,
    p_max_capacity INTEGER,
    p_admin_emails TEXT[]
) RETURNS INTEGER AS $$
DECLARE
    new_event_id INTEGER;
BEGIN
    INSERT INTO event (
        title, description, category_id, venue_id, organizer_id,
        upi_id, admin_contact, event_date, ticket_price, max_capacity,
        current_enrolled, status, created_at
    ) VALUES (
        p_title, p_description, p_category_id, p_venue_id, p_organizer_id,
        p_upi_id, p_admin_contact, p_event_date, p_ticket_price, p_max_capacity,
        0, 'Published', NOW()
    ) RETURNING event_id INTO new_event_id;

    -- Add new_event_id to organizer's admin_event_ids
    UPDATE users 
    SET admin_event_ids = array_append(COALESCE(admin_event_ids, '{}'), new_event_id)
    WHERE user_id = p_organizer_id;

    -- Add new_event_id to co-admins' admin_event_ids
    IF p_admin_emails IS NOT NULL AND array_length(p_admin_emails, 1) > 0 THEN
        UPDATE users
        SET admin_event_ids = array_append(COALESCE(admin_event_ids, '{}'), new_event_id)
        WHERE email = ANY(p_admin_emails);
    END IF;

    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;
`;

export const SAMPLE_SEED_SQL = `-- ============================================================================
-- INITIAL SEED DATA FOR SYMVIAN (Lowercase Tables & Columns)
-- ============================================================================

INSERT INTO users (user_id, full_name, email, password, phone, role, admin_event_ids) VALUES
(1, 'Arjun Sharma', 'arjun.sharma@amrita.edu', 'password123', '+91 98451 23456', 'Attendee', '{}'),
(2, 'Priya Patel', 'priya.patel@amrita.edu', 'password123', '+91 98452 34567', 'Organizer', '{1, 3}'),
(3, 'Devansh Kumar', 'devansh.k@amrita.edu', 'password123', '+91 98453 45678', 'Volunteer', '{1}'),
(4, 'Dr. Meera Iyer', 'meera.iyer@amrita.edu', 'password123', '+91 98454 56789', 'Admin', '{2}'),
(5, 'Rohan Verma', 'rohan.v@amrita.edu', 'password123', '+91 98455 67890', 'Attendee', '{}'),
(6, 'Ananya Nair', 'ananya.n@amrita.edu', 'password123', '+91 98456 78901', 'Attendee', '{1, 2, 4}'),
(7, 'Karthik Raja', 'karthik.r@amrita.edu', 'password123', '+91 98457 89012', 'Volunteer', '{}')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO venue (venue_id, venue_name, location_address, total_capacity, contact_email) VALUES
(1, 'SVP Indoor Arena', 'Amrita Amritapuri Campus, North Block Ground Floor', 500, 'venues.svp@amritapuri.amrita.edu'),
(2, 'Narendra Modi Stadium Hall', 'Sports Complex, Amrita Amritapuri Main Pavilion', 1200, 'stadium.desk@amritapuri.amrita.edu'),
(3, 'Dr. APJ Abdul Kalam Auditorium', 'Academic Block 3, 2nd Floor', 350, 'auditorium.kalam@amrita.edu'),
(4, 'Alan Turing Computing Lab', 'Computer Science Wing, 4th Floor', 80, 'cs.labs@amrita.edu')
ON CONFLICT (venue_id) DO NOTHING;

INSERT INTO category (category_id, category_name) VALUES
(1, 'Technical'),
(2, 'Cultural'),
(3, 'Hackathon'),
(4, 'Workshop'),
(5, 'Symposium')
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO event (event_id, title, description, category_id, venue_id, organizer_id, event_date, ticket_price, max_capacity, current_enrolled, status, upi_id, admin_contact) VALUES
(1, 'AI & SQL Optimization Summit', 'Deep dive into database query optimization, execution plans, and AI-accelerated indexing.', 1, 1, 2, '2026-10-24 09:30:00+00', 250.00, 50, 48, 'Published', 'priya@upi', '9876543210'),
(2, 'Annual Cultural Fest 2026', 'A grand celebration featuring music concerts, dance dramas, battle of the bands, and performances.', 2, 2, 2, '2026-11-10 17:00:00+00', 0.00, 100, 100, 'Published', 'priya@upi', '9876543210'),
(3, 'National 36-Hour Hackathon', 'Build next-gen database, cloud, and edge AI applications in 36 continuous hours with tech mentors.', 3, 4, 4, '2026-11-20 08:00:00+00', 500.00, 60, 35, 'Published', 'meera@upi', '9876543210'),
(4, 'Cloud Native & Microservices Workshop', 'Hands-on architectural workshop covering Docker, Kubernetes, gRPC, and ACID transactions.', 4, 3, 2, '2026-12-05 10:00:00+00', 150.00, 40, 40, 'Published', 'priya@upi', '9876543210')
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO registration (registration_id, event_id, user_id, registration_status, waitlist_position) VALUES
(1, 1, 1, 'Enrolled', NULL),
(2, 1, 5, 'Pending_Payment', NULL),
(3, 2, 5, 'Enrolled', NULL),
(4, 2, 1, 'Waitlisted', 1),
(5, 2, 6, 'Waitlisted', 2),
(6, 3, 1, 'Enrolled', NULL)
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO payment (payment_id, registration_id, amount, payment_status, transaction_reference, verified_at, verified_by) VALUES
(1, 1, 250.00, 'Verified', 'TXN_SQL_984512', '2026-09-25 10:20:00+00', 2),
(2, 2, 250.00, 'Pending', 'TXN_SQL_348910', NULL, NULL),
(3, 6, 500.00, 'Verified', 'TXN_HACK_772184', '2026-09-29 11:05:00+00', 4)
ON CONFLICT (payment_id) DO NOTHING;

INSERT INTO event_volunteer (assignment_id, event_id, user_id, assigned_role) VALUES
(1, 1, 3, 'Technical Lead & AV Coordinator'),
(2, 2, 3, 'Stage Manager'),
(3, 2, 7, 'Registration Desk & Crowd Control'),
(4, 3, 7, 'Hospitality & Logistics Coordinator')
ON CONFLICT (assignment_id) DO NOTHING;
`;
