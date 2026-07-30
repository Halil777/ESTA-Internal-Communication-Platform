BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.esta_add_column(
  table_name text,
  column_name text,
  column_type text
) RETURNS void AS $$
BEGIN
  EXECUTE format(
    'ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s',
    table_name,
    column_name,
    column_type
  );
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS ps_endpoints (id varchar(255) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_auths (id varchar(255) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_aors (id varchar(255) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_contacts (id varchar(255) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_domain_aliases (id varchar(255) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_endpoint_id_ips (id varchar(255) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_globals (id varchar(40) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_transports (id varchar(40) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_registrations (id varchar(255) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_subscription_persistence (id varchar(40) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_systems (id varchar(40) PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ps_resource_list (id varchar(40) PRIMARY KEY);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ps_endpoints' AND column_name = 'mwi_fromuser'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ps_endpoints' AND column_name = 'mwi_from_user'
  ) THEN
    ALTER TABLE ps_endpoints RENAME COLUMN mwi_fromuser TO mwi_from_user;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ps_endpoints' AND column_name = 'suppress_q850_reason_header'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ps_endpoints' AND column_name = 'suppress_q850_reason_headers'
  ) THEN
    ALTER TABLE ps_endpoints RENAME COLUMN suppress_q850_reason_header TO suppress_q850_reason_headers;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ps_transports' AND column_name = 'verifiy_server'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ps_transports' AND column_name = 'verify_server'
  ) THEN
    ALTER TABLE ps_transports RENAME COLUMN verifiy_server TO verify_server;
  END IF;
END $$;

SELECT pg_temp.esta_add_column('ps_endpoints', 'transport', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'aors', 'varchar(2048)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'auth', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'context', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'disallow', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'allow', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'direct_media', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'connected_line_method', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'direct_media_method', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'direct_media_glare_mitigation', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'disable_direct_media_on_nat', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtmf_mode', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'external_media_address', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'force_rport', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'ice_support', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'identify_by', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'mailboxes', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'moh_suggest', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'outbound_auth', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'outbound_proxy', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rewrite_contact', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rtp_ipv6', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rtp_symmetric', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'send_diversion', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'send_pai', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'send_rpid', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'timers_min_se', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'timers', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'timers_sess_expires', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'callerid', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'callerid_privacy', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'callerid_tag', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', '100rel', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'aggregate_mwi', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'trust_id_inbound', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'trust_id_outbound', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'use_ptime', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'use_avpf', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'media_encryption', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'inband_progress', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'call_group', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'pickup_group', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'named_call_group', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'named_pickup_group', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'device_state_busy_at', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'fax_detect', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 't38_udptl', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 't38_udptl_ec', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 't38_udptl_maxdatagram', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 't38_udptl_nat', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 't38_udptl_ipv6', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'tone_zone', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'language', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'one_touch_recording', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'record_on_feature', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'record_off_feature', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rtp_engine', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'allow_transfer', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'allow_subscribe', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'sdp_owner', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'sdp_session', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'tos_audio', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'tos_video', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'cos_audio', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'cos_video', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'sub_min_expiry', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'from_domain', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'from_user', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'mwi_from_user', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_verify', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_rekey', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_cert_file', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_private_key', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_cipher', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_ca_file', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_ca_path', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_setup', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'srtp_tag_32', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'media_address', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'redirect_method', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'set_var', 'text');
SELECT pg_temp.esta_add_column('ps_endpoints', 'message_context', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'force_avp', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'media_use_received_transport', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'accountcode', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'user_eq_phone', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'moh_passthrough', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'media_encryption_optimistic', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rpid_immediate', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'g726_non_standard', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rtp_keepalive', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rtp_timeout', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rtp_timeout_hold', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'bind_rtp_to_media_address', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'voicemail_extension', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'mwi_subscribe_replaces_unsolicited', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'deny', 'varchar(95)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'permit', 'varchar(95)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'acl', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'contact_deny', 'varchar(95)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'contact_permit', 'varchar(95)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'contact_acl', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'subscribe_context', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'fax_detect_timeout', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'contact_user', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'preferred_codec_only', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'asymmetric_rtp_codec', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'rtcp_mux', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'allow_overlap', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'refer_blind_progress', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'notify_early_inuse_ringing', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'max_audio_streams', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'max_video_streams', 'integer');
SELECT pg_temp.esta_add_column('ps_endpoints', 'webrtc', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_fingerprint', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'incoming_mwi_mailbox', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'bundle', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'dtls_auto_generate_cert', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'follow_early_media_fork', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'accept_multiple_sdp_answers', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'suppress_q850_reason_headers', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'trust_connected_line', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'send_connected_line', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'ignore_183_without_sdp', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'codec_prefs_incoming_offer', 'varchar(128)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'codec_prefs_outgoing_offer', 'varchar(128)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'codec_prefs_incoming_answer', 'varchar(128)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'codec_prefs_outgoing_answer', 'varchar(128)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'stir_shaken', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'send_history_info', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'allow_unauthenticated_options', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 't38_bind_udptl_to_media_address', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'geoloc_incoming_call_profile', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'geoloc_outgoing_call_profile', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'incoming_call_offer_pref', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'outgoing_call_offer_pref', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'stir_shaken_profile', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'security_negotiation', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'security_mechanisms', 'varchar(512)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'send_aoc', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoints', 'overlap_context', 'varchar(80)');

SELECT pg_temp.esta_add_column('ps_auths', 'auth_type', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_auths', 'nonce_lifetime', 'integer');
SELECT pg_temp.esta_add_column('ps_auths', 'md5_cred', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_auths', 'password', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_auths', 'realm', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_auths', 'username', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_auths', 'refresh_token', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_auths', 'oauth_clientid', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_auths', 'oauth_secret', 'varchar(255)');

SELECT pg_temp.esta_add_column('ps_aors', 'contact', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_aors', 'default_expiration', 'integer');
SELECT pg_temp.esta_add_column('ps_aors', 'mailboxes', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_aors', 'max_contacts', 'integer');
SELECT pg_temp.esta_add_column('ps_aors', 'minimum_expiration', 'integer');
SELECT pg_temp.esta_add_column('ps_aors', 'remove_existing', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_aors', 'qualify_frequency', 'integer');
SELECT pg_temp.esta_add_column('ps_aors', 'authenticate_qualify', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_aors', 'maximum_expiration', 'integer');
SELECT pg_temp.esta_add_column('ps_aors', 'outbound_proxy', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_aors', 'support_path', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_aors', 'qualify_timeout', 'double precision');
SELECT pg_temp.esta_add_column('ps_aors', 'voicemail_extension', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_aors', 'remove_unavailable', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_aors', 'qualify_2xx_only', 'varchar(10)');

SELECT pg_temp.esta_add_column('ps_contacts', 'uri', 'varchar(511)');
SELECT pg_temp.esta_add_column('ps_contacts', 'expiration_time', 'bigint');
SELECT pg_temp.esta_add_column('ps_contacts', 'qualify_frequency', 'integer');
SELECT pg_temp.esta_add_column('ps_contacts', 'outbound_proxy', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_contacts', 'path', 'text');
SELECT pg_temp.esta_add_column('ps_contacts', 'user_agent', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_contacts', 'qualify_timeout', 'double precision');
SELECT pg_temp.esta_add_column('ps_contacts', 'reg_server', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_contacts', 'authenticate_qualify', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_contacts', 'via_addr', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_contacts', 'via_port', 'integer');
SELECT pg_temp.esta_add_column('ps_contacts', 'call_id', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_contacts', 'endpoint', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_contacts', 'prune_on_boot', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_contacts', 'qualify_2xx_only', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_contacts', 'status', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_contacts', 'rtt', 'integer');

SELECT pg_temp.esta_add_column('ps_domain_aliases', 'domain', 'varchar(255)');

SELECT pg_temp.esta_add_column('ps_endpoint_id_ips', 'endpoint', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_endpoint_id_ips', 'match', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_endpoint_id_ips', 'srv_lookups', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_endpoint_id_ips', 'match_header', 'varchar(255)');

SELECT pg_temp.esta_add_column('ps_globals', 'max_forwards', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'user_agent', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_globals', 'default_outbound_endpoint', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_globals', 'debug', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_globals', 'endpoint_identifier_order', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_globals', 'max_initial_qualify_time', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'default_from_user', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_globals', 'keep_alive_interval', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'regcontext', 'varchar(80)');
SELECT pg_temp.esta_add_column('ps_globals', 'contact_expiration_check_interval', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'default_voicemail_extension', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_globals', 'disable_multi_domain', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_globals', 'unidentified_request_count', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'unidentified_request_period', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'unidentified_request_prune_interval', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'default_realm', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_globals', 'mwi_tps_queue_high', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'mwi_tps_queue_low', 'integer');
SELECT pg_temp.esta_add_column('ps_globals', 'mwi_disable_initial_unsolicited', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_globals', 'ignore_uri_user_options', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_globals', 'use_callerid_contact', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_globals', 'send_contact_status_on_update_registration', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_globals', 'taskprocessor_overload_trigger', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_globals', 'norefersub', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_globals', 'allow_sending_180_after_183', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_globals', 'all_codecs_on_empty_reinvite', 'varchar(10)');

SELECT pg_temp.esta_add_column('ps_transports', 'async_operations', 'integer');
SELECT pg_temp.esta_add_column('ps_transports', 'bind', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_transports', 'ca_list_file', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_transports', 'cert_file', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_transports', 'cipher', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_transports', 'domain', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_transports', 'external_media_address', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_transports', 'external_signaling_address', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_transports', 'external_signaling_port', 'integer');
SELECT pg_temp.esta_add_column('ps_transports', 'method', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_transports', 'local_net', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_transports', 'password', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_transports', 'priv_key_file', 'varchar(200)');
SELECT pg_temp.esta_add_column('ps_transports', 'protocol', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_transports', 'require_client_cert', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_transports', 'verify_client', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_transports', 'tos', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_transports', 'cos', 'integer');
SELECT pg_temp.esta_add_column('ps_transports', 'verify_server', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_transports', 'allow_reload', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_transports', 'symmetric_transport', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_transports', 'allow_wildcard_certs', 'varchar(10)');

SELECT pg_temp.esta_add_column('ps_registrations', 'auth_rejection_permanent', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_registrations', 'client_uri', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_registrations', 'contact_user', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_registrations', 'expiration', 'integer');
SELECT pg_temp.esta_add_column('ps_registrations', 'max_retries', 'integer');
SELECT pg_temp.esta_add_column('ps_registrations', 'outbound_auth', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_registrations', 'outbound_proxy', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_registrations', 'retry_interval', 'integer');
SELECT pg_temp.esta_add_column('ps_registrations', 'forbidden_retry_interval', 'integer');
SELECT pg_temp.esta_add_column('ps_registrations', 'server_uri', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_registrations', 'transport', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_registrations', 'support_path', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_registrations', 'fatal_retry_interval', 'integer');
SELECT pg_temp.esta_add_column('ps_registrations', 'line', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_registrations', 'endpoint', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_registrations', 'support_outbound', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_registrations', 'contact_header_params', 'varchar(255)');
SELECT pg_temp.esta_add_column('ps_registrations', 'max_random_initial_delay', 'integer');
SELECT pg_temp.esta_add_column('ps_registrations', 'security_negotiation', 'varchar(20)');
SELECT pg_temp.esta_add_column('ps_registrations', 'security_mechanisms', 'varchar(512)');

SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'packet', 'varchar(2048)');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'src_name', 'varchar(128)');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'src_port', 'integer');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'transport_key', 'varchar(64)');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'local_name', 'varchar(128)');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'local_port', 'integer');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'cseq', 'integer');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'tag', 'varchar(128)');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'endpoint', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'expires', 'integer');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'contact_uri', 'varchar(256)');
SELECT pg_temp.esta_add_column('ps_subscription_persistence', 'prune_on_boot', 'varchar(10)');

SELECT pg_temp.esta_add_column('ps_systems', 'timer_t1', 'integer');
SELECT pg_temp.esta_add_column('ps_systems', 'timer_b', 'integer');
SELECT pg_temp.esta_add_column('ps_systems', 'compact_headers', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_systems', 'threadpool_initial_size', 'integer');
SELECT pg_temp.esta_add_column('ps_systems', 'threadpool_auto_increment', 'integer');
SELECT pg_temp.esta_add_column('ps_systems', 'threadpool_idle_timeout', 'integer');
SELECT pg_temp.esta_add_column('ps_systems', 'threadpool_max_size', 'integer');
SELECT pg_temp.esta_add_column('ps_systems', 'disable_tcp_switch', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_systems', 'follow_early_media_fork', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_systems', 'accept_multiple_sdp_answers', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_systems', 'disable_rport', 'varchar(10)');

SELECT pg_temp.esta_add_column('ps_resource_list', 'list_item', 'varchar(2048)');
SELECT pg_temp.esta_add_column('ps_resource_list', 'event', 'varchar(40)');
SELECT pg_temp.esta_add_column('ps_resource_list', 'full_state', 'varchar(10)');
SELECT pg_temp.esta_add_column('ps_resource_list', 'notification_batch_interval', 'integer');
SELECT pg_temp.esta_add_column('ps_resource_list', 'resource_display_name', 'varchar(10)');

ALTER TABLE ps_endpoints ALTER COLUMN id TYPE varchar(255);
ALTER TABLE ps_endpoints ALTER COLUMN aors TYPE varchar(2048);
ALTER TABLE ps_endpoints ALTER COLUMN auth TYPE varchar(255);
ALTER TABLE ps_endpoints ALTER COLUMN outbound_auth TYPE varchar(255);
ALTER TABLE ps_endpoints ALTER COLUMN outbound_proxy TYPE varchar(255);
ALTER TABLE ps_endpoints ALTER COLUMN callerid TYPE varchar(255);

ALTER TABLE ps_auths ALTER COLUMN id TYPE varchar(255);
ALTER TABLE ps_auths ALTER COLUMN realm TYPE varchar(255);
ALTER TABLE ps_auths ALTER COLUMN password TYPE varchar(255);

ALTER TABLE ps_aors ALTER COLUMN id TYPE varchar(255);
ALTER TABLE ps_aors ALTER COLUMN contact TYPE varchar(255);
ALTER TABLE ps_aors ALTER COLUMN outbound_proxy TYPE varchar(255);
ALTER TABLE ps_aors ALTER COLUMN qualify_timeout TYPE double precision USING
  CASE WHEN qualify_timeout::text ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN qualify_timeout::text::double precision ELSE NULL END;

ALTER TABLE ps_contacts ALTER COLUMN id TYPE varchar(255);
ALTER TABLE ps_contacts ALTER COLUMN uri TYPE varchar(511);
ALTER TABLE ps_contacts ALTER COLUMN outbound_proxy TYPE varchar(255);
ALTER TABLE ps_contacts ALTER COLUMN user_agent TYPE varchar(255);
ALTER TABLE ps_contacts ALTER COLUMN reg_server TYPE varchar(255);
ALTER TABLE ps_contacts ALTER COLUMN endpoint TYPE varchar(255);
ALTER TABLE ps_contacts ALTER COLUMN expiration_time TYPE bigint USING
  CASE WHEN expiration_time::text ~ '^[0-9]+$' THEN expiration_time::text::bigint ELSE NULL END;
ALTER TABLE ps_contacts ALTER COLUMN qualify_timeout TYPE double precision USING
  CASE WHEN qualify_timeout::text ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN qualify_timeout::text::double precision ELSE NULL END;

ALTER TABLE ps_domain_aliases ALTER COLUMN id TYPE varchar(255);
ALTER TABLE ps_domain_aliases ALTER COLUMN domain TYPE varchar(255);
ALTER TABLE ps_endpoint_id_ips ALTER COLUMN id TYPE varchar(255);
ALTER TABLE ps_endpoint_id_ips ALTER COLUMN endpoint TYPE varchar(255);
ALTER TABLE ps_registrations ALTER COLUMN id TYPE varchar(255);
ALTER TABLE ps_registrations ALTER COLUMN client_uri TYPE varchar(255);
ALTER TABLE ps_registrations ALTER COLUMN server_uri TYPE varchar(255);
ALTER TABLE ps_registrations ALTER COLUMN outbound_auth TYPE varchar(255);
ALTER TABLE ps_registrations ALTER COLUMN outbound_proxy TYPE varchar(255);
ALTER TABLE ps_registrations ALTER COLUMN endpoint TYPE varchar(255);

CREATE INDEX IF NOT EXISTS ps_endpoints_id ON ps_endpoints (id);
CREATE INDEX IF NOT EXISTS ps_auths_id ON ps_auths (id);
CREATE INDEX IF NOT EXISTS ps_aors_id ON ps_aors (id);
CREATE INDEX IF NOT EXISTS ps_aors_qualifyfreq_contact ON ps_aors (qualify_frequency, contact);
CREATE INDEX IF NOT EXISTS ps_contacts_id ON ps_contacts (id);
CREATE INDEX IF NOT EXISTS ps_contacts_endpoint ON ps_contacts (endpoint);
CREATE INDEX IF NOT EXISTS ps_contacts_qualifyfreq_exp ON ps_contacts (qualify_frequency, expiration_time);
CREATE UNIQUE INDEX IF NOT EXISTS ps_contacts_uq ON ps_contacts (id, reg_server);
CREATE INDEX IF NOT EXISTS ps_domain_aliases_id ON ps_domain_aliases (id);
CREATE INDEX IF NOT EXISTS ps_endpoint_id_ips_id ON ps_endpoint_id_ips (id);
CREATE INDEX IF NOT EXISTS ps_globals_id ON ps_globals (id);
CREATE INDEX IF NOT EXISTS ps_transports_id ON ps_transports (id);
CREATE INDEX IF NOT EXISTS ps_registrations_id ON ps_registrations (id);
CREATE INDEX IF NOT EXISTS ps_subscription_persistence_id ON ps_subscription_persistence (id);

COMMIT;
