CREATE TABLE IF NOT EXISTS ps_endpoints (
  id varchar(255) PRIMARY KEY,
  transport varchar(40),
  aors varchar(2048),
  auth varchar(255),
  context varchar(40),
  disallow varchar(200),
  allow varchar(200),
  direct_media varchar(10),
  connected_line_method varchar(20),
  direct_media_method varchar(20),
  direct_media_glare_mitigation varchar(20),
  disable_direct_media_on_nat varchar(10),
  dtmf_mode varchar(40),
  external_media_address varchar(40),
  force_rport varchar(10),
  ice_support varchar(10),
  identify_by varchar(80),
  mailboxes varchar(40),
  moh_suggest varchar(40),
  outbound_auth varchar(255),
  outbound_proxy varchar(255),
  rewrite_contact varchar(10),
  rtp_ipv6 varchar(10),
  rtp_symmetric varchar(10),
  send_diversion varchar(10),
  send_pai varchar(10),
  send_rpid varchar(10),
  timers_min_se integer,
  timers varchar(20),
  timers_sess_expires integer,
  callerid varchar(255),
  callerid_privacy varchar(40),
  callerid_tag varchar(40),
  "100rel" varchar(40),
  aggregate_mwi varchar(10),
  trust_id_inbound varchar(10),
  trust_id_outbound varchar(10),
  use_ptime varchar(10),
  use_avpf varchar(10),
  media_encryption varchar(40),
  inband_progress varchar(10),
  call_group varchar(40),
  pickup_group varchar(40),
  named_call_group varchar(40),
  named_pickup_group varchar(40),
  device_state_busy_at integer,
  fax_detect varchar(10),
  t38_udptl varchar(10),
  t38_udptl_ec varchar(20),
  t38_udptl_maxdatagram integer,
  t38_udptl_nat varchar(10),
  t38_udptl_ipv6 varchar(10),
  tone_zone varchar(40),
  language varchar(40),
  one_touch_recording varchar(10),
  record_on_feature varchar(40),
  record_off_feature varchar(40),
  rtp_engine varchar(40),
  allow_transfer varchar(10),
  allow_subscribe varchar(10),
  sdp_owner varchar(40),
  sdp_session varchar(40),
  tos_audio varchar(10),
  tos_video varchar(10),
  cos_audio integer,
  cos_video integer,
  sub_min_expiry integer,
  from_domain varchar(40),
  from_user varchar(40),
  mwi_from_user varchar(40),
  dtls_verify varchar(40),
  dtls_rekey varchar(40),
  dtls_cert_file varchar(200),
  dtls_private_key varchar(200),
  dtls_cipher varchar(200),
  dtls_ca_file varchar(200),
  dtls_ca_path varchar(200),
  dtls_setup varchar(20),
  srtp_tag_32 varchar(10),
  media_address varchar(40),
  redirect_method varchar(20),
  set_var text,
  message_context varchar(40),
  force_avp varchar(10),
  media_use_received_transport varchar(10),
  accountcode varchar(80),
  user_eq_phone varchar(10),
  moh_passthrough varchar(10),
  media_encryption_optimistic varchar(10),
  rpid_immediate varchar(10),
  g726_non_standard varchar(10),
  rtp_keepalive integer,
  rtp_timeout integer,
  rtp_timeout_hold integer,
  bind_rtp_to_media_address varchar(10),
  voicemail_extension varchar(40),
  mwi_subscribe_replaces_unsolicited varchar(10),
  deny varchar(95),
  permit varchar(95),
  acl varchar(40),
  contact_deny varchar(95),
  contact_permit varchar(95),
  contact_acl varchar(40),
  subscribe_context varchar(40),
  fax_detect_timeout integer,
  contact_user varchar(80),
  preferred_codec_only varchar(10),
  asymmetric_rtp_codec varchar(10),
  rtcp_mux varchar(10),
  allow_overlap varchar(10),
  refer_blind_progress varchar(10),
  notify_early_inuse_ringing varchar(10),
  max_audio_streams integer,
  max_video_streams integer,
  webrtc varchar(10),
  dtls_fingerprint varchar(20),
  incoming_mwi_mailbox varchar(40),
  bundle varchar(10),
  dtls_auto_generate_cert varchar(10),
  follow_early_media_fork varchar(10),
  accept_multiple_sdp_answers varchar(10),
  suppress_q850_reason_headers varchar(10),
  trust_connected_line varchar(10),
  send_connected_line varchar(10),
  ignore_183_without_sdp varchar(10),
  codec_prefs_incoming_offer varchar(128),
  codec_prefs_outgoing_offer varchar(128),
  codec_prefs_incoming_answer varchar(128),
  codec_prefs_outgoing_answer varchar(128),
  stir_shaken varchar(10),
  send_history_info varchar(10),
  allow_unauthenticated_options varchar(10),
  t38_bind_udptl_to_media_address varchar(10),
  geoloc_incoming_call_profile varchar(80),
  geoloc_outgoing_call_profile varchar(80),
  incoming_call_offer_pref varchar(40),
  outgoing_call_offer_pref varchar(40),
  stir_shaken_profile varchar(80),
  security_negotiation varchar(20),
  security_mechanisms varchar(512),
  send_aoc varchar(10),
  overlap_context varchar(80)
);

CREATE INDEX IF NOT EXISTS ps_endpoints_id ON ps_endpoints (id);

CREATE TABLE IF NOT EXISTS ps_auths (
  id varchar(255) PRIMARY KEY,
  auth_type varchar(40),
  nonce_lifetime integer,
  md5_cred varchar(40),
  password varchar(255),
  realm varchar(255),
  username varchar(40),
  refresh_token varchar(255),
  oauth_clientid varchar(255),
  oauth_secret varchar(255)
);

CREATE INDEX IF NOT EXISTS ps_auths_id ON ps_auths (id);

CREATE TABLE IF NOT EXISTS ps_aors (
  id varchar(255) PRIMARY KEY,
  contact varchar(255),
  default_expiration integer,
  mailboxes varchar(80),
  max_contacts integer,
  minimum_expiration integer,
  remove_existing varchar(10),
  qualify_frequency integer,
  authenticate_qualify varchar(10),
  maximum_expiration integer,
  outbound_proxy varchar(255),
  support_path varchar(10),
  qualify_timeout double precision,
  voicemail_extension varchar(40),
  remove_unavailable varchar(10),
  qualify_2xx_only varchar(10)
);

CREATE INDEX IF NOT EXISTS ps_aors_id ON ps_aors (id);
CREATE INDEX IF NOT EXISTS ps_aors_qualifyfreq_contact ON ps_aors (qualify_frequency, contact);

CREATE TABLE IF NOT EXISTS ps_contacts (
  id varchar(255) PRIMARY KEY,
  uri varchar(511),
  expiration_time bigint,
  qualify_frequency integer,
  outbound_proxy varchar(255),
  path text,
  user_agent varchar(255),
  qualify_timeout double precision,
  reg_server varchar(255),
  authenticate_qualify varchar(10),
  via_addr varchar(40),
  via_port integer,
  call_id varchar(255),
  endpoint varchar(255),
  prune_on_boot varchar(10),
  qualify_2xx_only varchar(10),
  status varchar(40),
  rtt integer
);

CREATE UNIQUE INDEX IF NOT EXISTS ps_contacts_uq ON ps_contacts (id, reg_server);
CREATE INDEX IF NOT EXISTS ps_contacts_id ON ps_contacts (id);
CREATE INDEX IF NOT EXISTS ps_contacts_endpoint ON ps_contacts (endpoint);
CREATE INDEX IF NOT EXISTS ps_contacts_qualifyfreq_exp ON ps_contacts (qualify_frequency, expiration_time);

CREATE TABLE IF NOT EXISTS ps_domain_aliases (
  id varchar(255) PRIMARY KEY,
  domain varchar(255)
);

CREATE INDEX IF NOT EXISTS ps_domain_aliases_id ON ps_domain_aliases (id);

CREATE TABLE IF NOT EXISTS ps_endpoint_id_ips (
  id varchar(255) PRIMARY KEY,
  endpoint varchar(255),
  match varchar(80),
  srv_lookups varchar(10),
  match_header varchar(255)
);

CREATE INDEX IF NOT EXISTS ps_endpoint_id_ips_id ON ps_endpoint_id_ips (id);

CREATE TABLE IF NOT EXISTS ps_globals (
  id varchar(40) PRIMARY KEY,
  max_forwards integer,
  user_agent varchar(255),
  default_outbound_endpoint varchar(40),
  debug varchar(40),
  endpoint_identifier_order varchar(40),
  max_initial_qualify_time integer,
  default_from_user varchar(80),
  keep_alive_interval integer,
  regcontext varchar(80),
  contact_expiration_check_interval integer,
  default_voicemail_extension varchar(40),
  disable_multi_domain varchar(10),
  unidentified_request_count integer,
  unidentified_request_period integer,
  unidentified_request_prune_interval integer,
  default_realm varchar(40),
  mwi_tps_queue_high integer,
  mwi_tps_queue_low integer,
  mwi_disable_initial_unsolicited varchar(10),
  ignore_uri_user_options varchar(10),
  use_callerid_contact varchar(10),
  send_contact_status_on_update_registration varchar(10),
  taskprocessor_overload_trigger varchar(20),
  norefersub varchar(10),
  allow_sending_180_after_183 varchar(10),
  all_codecs_on_empty_reinvite varchar(10)
);

CREATE INDEX IF NOT EXISTS ps_globals_id ON ps_globals (id);

CREATE TABLE IF NOT EXISTS ps_transports (
  id varchar(40) PRIMARY KEY,
  async_operations integer,
  bind varchar(40),
  ca_list_file varchar(200),
  cert_file varchar(200),
  cipher varchar(200),
  domain varchar(40),
  external_media_address varchar(40),
  external_signaling_address varchar(40),
  external_signaling_port integer,
  method varchar(40),
  local_net varchar(40),
  password varchar(40),
  priv_key_file varchar(200),
  protocol varchar(20),
  require_client_cert varchar(10),
  verify_client varchar(10),
  tos varchar(10),
  cos integer,
  verify_server varchar(10),
  allow_reload varchar(10),
  symmetric_transport varchar(10),
  allow_wildcard_certs varchar(10)
);

CREATE INDEX IF NOT EXISTS ps_transports_id ON ps_transports (id);

CREATE TABLE IF NOT EXISTS ps_registrations (
  id varchar(255) PRIMARY KEY,
  auth_rejection_permanent varchar(10),
  client_uri varchar(255),
  contact_user varchar(40),
  expiration integer,
  max_retries integer,
  outbound_auth varchar(255),
  outbound_proxy varchar(255),
  retry_interval integer,
  forbidden_retry_interval integer,
  server_uri varchar(255),
  transport varchar(40),
  support_path varchar(10),
  fatal_retry_interval integer,
  line varchar(10),
  endpoint varchar(255),
  support_outbound varchar(10),
  contact_header_params varchar(255),
  max_random_initial_delay integer,
  security_negotiation varchar(20),
  security_mechanisms varchar(512)
);

CREATE INDEX IF NOT EXISTS ps_registrations_id ON ps_registrations (id);

CREATE TABLE IF NOT EXISTS ps_subscription_persistence (
  id varchar(40) PRIMARY KEY,
  packet varchar(2048),
  src_name varchar(128),
  src_port integer,
  transport_key varchar(64),
  local_name varchar(128),
  local_port integer,
  cseq integer,
  tag varchar(128),
  endpoint varchar(40),
  expires integer,
  contact_uri varchar(256),
  prune_on_boot varchar(10)
);

CREATE INDEX IF NOT EXISTS ps_subscription_persistence_id ON ps_subscription_persistence (id);

CREATE TABLE IF NOT EXISTS ps_systems (
  id varchar(40) PRIMARY KEY,
  timer_t1 integer,
  timer_b integer,
  compact_headers varchar(10),
  threadpool_initial_size integer,
  threadpool_auto_increment integer,
  threadpool_idle_timeout integer,
  threadpool_max_size integer,
  disable_tcp_switch varchar(10),
  follow_early_media_fork varchar(10),
  accept_multiple_sdp_answers varchar(10),
  disable_rport varchar(10)
);

CREATE TABLE IF NOT EXISTS ps_resource_list (
  id varchar(40) PRIMARY KEY,
  list_item varchar(2048),
  event varchar(40),
  full_state varchar(10),
  notification_batch_interval integer,
  resource_display_name varchar(10)
);
