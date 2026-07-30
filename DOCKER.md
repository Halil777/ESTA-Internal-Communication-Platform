# Esta Connect Docker Run Guide

This stack runs PostgreSQL, Asterisk, backend, and admin together.

## Start

Open Docker Desktop first. Then run from the project root:

```powershell
cd C:\Users\Admin\Desktop\Esta-Connect
docker compose up -d --build
```

Admin panel:

```text
http://localhost:5173
```

Backend health:

```text
http://localhost:3001/api/v1
```

Default admin login seeded by the backend:

```text
admin / Admin@123456
```

## LAN IP

Android APK is currently built for this host IP:

```text
10.10.20.231
```

Docker Compose also uses this IP as `ASTERISK_PUBLIC_IP` and SIP domain by
default. If this computer gets another LAN IP, change `ASTERISK_PUBLIC_IP` when
starting:

```powershell
$env:ASTERISK_PUBLIC_IP="YOUR_PC_LAN_IP"
docker compose up -d --build
```

Then rebuild the Android APK with the same IP in
`android/app/build.gradle.kts`.

## Useful Commands

Check containers:

```powershell
docker compose ps
```

Follow backend logs:

```powershell
docker compose logs -f backend
```

Follow Asterisk logs:

```powershell
docker compose logs -f asterisk
```

Open Asterisk CLI:

```powershell
docker compose exec asterisk asterisk -rvvv
```

Check PBX from Asterisk CLI:

```text
manager show connected
pjsip show transports
pjsip show endpoints
pjsip show contacts
dialplan show internal
```

Stop without deleting data:

```powershell
docker compose down
```

Reset all Docker data:

```powershell
docker compose down -v
```

## Ports

Windows Firewall must allow:

- Backend TCP `3001`
- Admin TCP `5173`
- SIP UDP `5060`
- RTP UDP `10000-20000`

AMI TCP `5038` is bound only to `127.0.0.1` for local debugging; backend reaches
AMI through the internal Docker network using `asterisk:5038`.
