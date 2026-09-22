-- =============================================================================
-- CloudGuard AI Platform — Supabase Row Level Security (RLS) Policy Guide
-- Database: PostgreSQL (Supabase)
-- Author: CloudGuard Security Architecture Team
-- =============================================================================

-- 1. ARCHITECTURAL OVERVIEW
-- The CloudGuard AI FastAPI backend acts as the authoritative security gateway.
-- Backend queries connect via PostgreSQL pooled connection (DATABASE_URL) and
-- enforce strict user_id query scoping on all SELECT, INSERT, UPDATE, and DELETE operations.
--
-- If direct client access to Supabase tables is ever enabled via Supabase PostgREST/JS SDK,
-- the following Row Level Security (RLS) policies enforce cryptographic multi-tenant isolation
-- at the database engine level.

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL USER-OWNED TABLES
-- =============================================================================

ALTER TABLE cloud_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gemini_audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. DEFINE ISOLATION POLICIES (Normal Users: Own Data Only | Admin: Full Access)
-- =============================================================================

-- CLOUD ACCOUNTS
CREATE POLICY "cloud_accounts_tenant_isolation" ON cloud_accounts
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- DATA SOURCES
CREATE POLICY "data_sources_tenant_isolation" ON data_sources
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- INGESTION JOBS
CREATE POLICY "ingestion_jobs_tenant_isolation" ON ingestion_jobs
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- CLOUD RESOURCES (ASSETS)
CREATE POLICY "cloud_resources_tenant_isolation" ON cloud_resources
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- SECURITY FINDINGS
CREATE POLICY "findings_tenant_isolation" ON findings
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- INCIDENTS
CREATE POLICY "incidents_tenant_isolation" ON incidents
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- REMEDIATION PLANS
CREATE POLICY "remediation_plans_tenant_isolation" ON remediation_plans
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- GEMINI AUDIT LOGS
CREATE POLICY "gemini_audit_logs_tenant_isolation" ON gemini_audit_logs
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
    )
    WITH CHECK (
        auth.uid()::text = user_id
    );

-- =============================================================================
-- 4. SERVICE ROLE PERMISSIONS
-- =============================================================================
-- The FastAPI backend connects using the standard Postgres connection string,
-- which possesses the BYPASSRLS attribute in Supabase, ensuring backend services
-- maintain high-throughput connection pooling without latency regressions.
