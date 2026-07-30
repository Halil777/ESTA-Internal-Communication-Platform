#!/usr/bin/env sh
set -eu

MIGRATION_FILE="${1:-docker/postgres/migrations/20260730-asterisk20-pjsip-realtime.sql}"
BACKUP_FILE="esta_connect_before_asterisk_schema_fix_$(date +%Y%m%d_%H%M%S).sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Migration file not found: $MIGRATION_FILE" >&2
  exit 1
fi

docker exec esta_postgres pg_dump -U esta_user -d esta_connect > "$BACKUP_FILE"
echo "Backup written: $BACKUP_FILE"

docker exec -i esta_postgres psql -U esta_user -d esta_connect < "$MIGRATION_FILE"
docker restart esta_asterisk >/dev/null

docker exec esta_asterisk asterisk -rx "pjsip show endpoints"
docker exec esta_asterisk asterisk -rx "pjsip show contacts"
