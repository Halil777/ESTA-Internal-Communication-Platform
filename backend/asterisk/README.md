# Asterisk Setup For Esta Connect

These snippets are the minimum PBX-side configuration expected by the backend.
The preferred production path stores PJSIP endpoint/auth/aor objects in
PostgreSQL through Asterisk Realtime (`res_odbc`, `extconfig.conf`,
`sorcery.conf`). The AMI `UpdateConfig` path remains available as a local
Docker fallback while the PBX is being brought up.

For the Docker stack, prefer the root `docker-compose.yml`. It builds an
Asterisk container, creates the PJSIP realtime tables in PostgreSQL on first
database init, and also keeps `pjsip.endpoints.conf` for fallback provisioning.

## Required Ports

- AMI TCP: `5038` from the backend host only
- SIP UDP: `5060` from phones/admin LAN
- RTP UDP: usually `10000-20000` between phones and Asterisk

## Files

- `manager.conf`: AMI user used by `ASTERISK_AMI_USER` and `ASTERISK_AMI_SECRET`
- `pjsip.transports.conf`: PJSIP UDP transport section used by `ASTERISK_PJSIP_TRANSPORT_SECTION`
- `extensions.internal.conf`: internal extension-to-extension dialplan
- `res_odbc.conf`: Asterisk ODBC connector named `asterisk`
- `extconfig.conf`: realtime table-to-ODBC mappings
- `sorcery.conf`: PJSIP object mappings for realtime + static fallback

Include these snippets from your Asterisk config, or copy the sections into the
matching Asterisk files.

## Backend Env

The backend `.env` must match Asterisk:

```env
ASTERISK_HOST=127.0.0.1
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USER=esta_ami_user
ASTERISK_AMI_SECRET=esta_ami_password
ASTERISK_ARI_URL=http://127.0.0.1:8088
ASTERISK_ARI_USER=esta_ari_user
ASTERISK_ARI_SECRET=esta_ari_password
ASTERISK_SIP_DOMAIN=10.10.20.231
ASTERISK_SIP_PORT=5060
ASTERISK_SIP_TRANSPORT=UDP
ASTERISK_PJSIP_TRANSPORT_SECTION=transport-udp
ASTERISK_PJSIP_CONFIG_FILE=pjsip.conf
ASTERISK_PROVISIONING_MODE=both
```

`ASTERISK_HOST` is where the backend reaches AMI. `ASTERISK_SIP_DOMAIN` is the
IP or DNS name Android clients use for SIP registration.

## Verify In Asterisk CLI

```bash
manager show connected
pjsip show transports
pjsip show endpoints
pjsip show contacts
dialplan show internal
```

After a user logs in on Android, the backend should create that extension in
`ps_endpoints`, `ps_auths`, and `ps_aors`; Asterisk should show it in
`pjsip show endpoints`, and the phone should appear in `pjsip show contacts`.
