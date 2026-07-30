CREATE TABLE IF NOT EXISTS ps_endpoints (
  id varchar(80) PRIMARY KEY,
  transport varchar(80),
  aors varchar(80),
  auth varchar(80),
  context varchar(80),
  disallow varchar(200),
  allow varchar(200),
  direct_media varchar(10),
  rewrite_contact varchar(10),
  force_rport varchar(10),
  rtp_symmetric varchar(10),
  ice_support varchar(10),
  dtmf_mode varchar(30),
  callerid varchar(200),
  webrtc varchar(10),
  media_encryption varchar(40),
  device_state_busy_at integer,
  allow_subscribe varchar(10),
  send_pai varchar(10),
  send_rpid varchar(10),
  trust_id_inbound varchar(10),
  trust_id_outbound varchar(10)
);

CREATE TABLE IF NOT EXISTS ps_auths (
  id varchar(80) PRIMARY KEY,
  auth_type varchar(40),
  username varchar(80),
  password text,
  realm varchar(120),
  nonce_lifetime integer
);

CREATE TABLE IF NOT EXISTS ps_aors (
  id varchar(80) PRIMARY KEY,
  contact text,
  default_expiration integer,
  maximum_expiration integer,
  minimum_expiration integer,
  max_contacts integer,
  remove_existing varchar(10),
  qualify_frequency integer,
  qualify_timeout real,
  authenticate_qualify varchar(10),
  support_path varchar(10)
);

CREATE TABLE IF NOT EXISTS ps_contacts (
  id varchar(255) PRIMARY KEY,
  endpoint varchar(80),
  uri text,
  expiration_time bigint,
  qualify_frequency integer,
  qualify_timeout real,
  user_agent text,
  via_addr varchar(45),
  via_port integer,
  call_id text,
  reg_server varchar(80)
);

CREATE INDEX IF NOT EXISTS idx_ps_contacts_endpoint ON ps_contacts(endpoint);

CREATE TABLE IF NOT EXISTS ps_endpoint_id_ips (
  id varchar(80) PRIMARY KEY,
  endpoint varchar(80),
  match text,
  srv_lookups varchar(10),
  match_header text
);

CREATE TABLE IF NOT EXISTS ps_transports (
  id varchar(80) PRIMARY KEY,
  protocol varchar(20),
  bind varchar(80),
  external_media_address varchar(80),
  external_signaling_address varchar(80),
  local_net text,
  method varchar(20),
  cert_file text,
  priv_key_file text,
  ca_list_file text,
  cipher text,
  verify_client varchar(10),
  verify_server varchar(10)
);

CREATE TABLE IF NOT EXISTS ps_domain_aliases (
  id varchar(80) PRIMARY KEY,
  domain varchar(80)
);

CREATE TABLE IF NOT EXISTS ps_globals (
  id varchar(80) PRIMARY KEY,
  user_agent varchar(120),
  default_outbound_endpoint varchar(80),
  debug varchar(10)
);

CREATE TABLE IF NOT EXISTS ps_registrations (
  id varchar(80) PRIMARY KEY,
  client_uri text,
  server_uri text,
  transport varchar(80),
  outbound_auth varchar(80),
  retry_interval integer,
  forbidden_retry_interval integer,
  expiration integer
);

CREATE TABLE IF NOT EXISTS ps_subscription_persistence (
  id varchar(255) PRIMARY KEY,
  packet text,
  src_name varchar(128),
  src_port integer,
  transport_key varchar(64)
);
