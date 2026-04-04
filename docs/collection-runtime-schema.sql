-- Minimal schema notes for real collection runner.
-- This file documents columns expected by server/worker + frontend hooks.

-- jobs table
-- required: id, status, governorate, city, category, source
-- required lifecycle fields: retry_count, max_retries, claimed_at, started_at, finished_at, failure_reason, last_updated
-- optional: discovery_run_id, records_found, error_count, agent_name, created_at

-- discovery_runs table
-- required: id, status, governorate, category, started_at, completed_at, records_found, source_count
-- optional: summary (jsonb), error_message

-- records table (canonical target)
-- required: id, name_en, name_ar, category, governorate, city
-- required canonical mapping: latitude/longitude + is_verified + source_name
-- required quality fields: completeness_score, validation_issues, match_decision, status, last_updated
-- optional: phone, whatsapp, email, website, address, source_url, external_id

-- logs table
-- required: id, timestamp, level, source, message, metadata
