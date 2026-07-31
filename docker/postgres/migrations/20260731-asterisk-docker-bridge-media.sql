-- Keep Asterisk reachable from LAN clients when it runs inside Docker bridge mode.
-- The phone LAN must not be marked as PJSIP local_net; otherwise Asterisk
-- advertises its container IP (for example 172.18.0.2) in SIP Contact/SDP.

BEGIN;

ALTER TABLE ps_transports ADD COLUMN IF NOT EXISTS external_signaling_port integer;

UPDATE ps_transports
SET
  external_media_address = COALESCE(NULLIF(external_media_address, ''), '10.10.20.231'),
  external_signaling_address = COALESCE(NULLIF(external_signaling_address, ''), '10.10.20.231'),
  external_signaling_port = COALESCE(external_signaling_port, 5060),
  local_net = '172.16.0.0/12'
WHERE id = 'transport-udp';

UPDATE ps_endpoints
SET
  direct_media = 'no',
  rewrite_contact = 'yes',
  force_rport = 'yes',
  rtp_symmetric = 'yes',
  ice_support = 'no'
WHERE id IS NOT NULL;

COMMIT;
