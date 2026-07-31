#!/bin/sh
set -eu

ASTERISK_PUBLIC_IP="${ASTERISK_PUBLIC_IP:-10.10.20.231}"
ASTERISK_LOCAL_NET="${ASTERISK_LOCAL_NET:-10.10.20.0/24}"
ASTERISK_PJSIP_LOCAL_NET="${ASTERISK_PJSIP_LOCAL_NET:-172.16.0.0/12}"
ASTERISK_RTP_START="${ASTERISK_RTP_START:-10000}"
ASTERISK_RTP_END="${ASTERISK_RTP_END:-10100}"
ASTERISK_AMI_USER="${ASTERISK_AMI_USER:-esta_ami_user}"
ASTERISK_AMI_SECRET="${ASTERISK_AMI_SECRET:-esta_ami_password}"
ASTERISK_ARI_USER="${ASTERISK_ARI_USER:-esta_ari_user}"
ASTERISK_ARI_SECRET="${ASTERISK_ARI_SECRET:-esta_ari_password}"
ASTERISK_ODBC_DSN="${ASTERISK_ODBC_DSN:-esta_pbx}"
ASTERISK_ODBC_HOST="${ASTERISK_ODBC_HOST:-postgres}"
ASTERISK_ODBC_PORT="${ASTERISK_ODBC_PORT:-5432}"
ASTERISK_ODBC_DATABASE="${ASTERISK_ODBC_DATABASE:-esta_connect}"
ASTERISK_ODBC_USER="${ASTERISK_ODBC_USER:-esta_user}"
ASTERISK_ODBC_PASSWORD="${ASTERISK_ODBC_PASSWORD:-esta_strong_password}"
TEMPLATE_DIR="/usr/local/share/esta-asterisk/templates"

is_uint() {
  case "$1" in
    ''|*[!0-9]*)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

if ! is_uint "${ASTERISK_RTP_START}" || ! is_uint "${ASTERISK_RTP_END}"; then
  echo "ERROR: RTP ports must be numeric"
  exit 1
fi

RTP_PORT_COUNT=$((ASTERISK_RTP_END - ASTERISK_RTP_START + 1))

if [ "${ASTERISK_RTP_END}" -lt "${ASTERISK_RTP_START}" ]; then
  echo "ERROR: RTP end port must be greater than start port"
  exit 1
fi

if [ "${RTP_PORT_COUNT}" -gt 1000 ]; then
  echo "ERROR: RTP range is too large: ${ASTERISK_RTP_START}-${ASTERISK_RTP_END}"
  echo "Maximum allowed range is 1000 ports."
  exit 1
fi

render() {
  src="$1"
  dst="$2"
  sed \
    -e "s|__ASTERISK_PUBLIC_IP__|${ASTERISK_PUBLIC_IP}|g" \
    -e "s|__ASTERISK_LOCAL_NET__|${ASTERISK_LOCAL_NET}|g" \
    -e "s|__ASTERISK_PJSIP_LOCAL_NET__|${ASTERISK_PJSIP_LOCAL_NET}|g" \
    -e "s|__ASTERISK_RTP_START__|${ASTERISK_RTP_START}|g" \
    -e "s|__ASTERISK_RTP_END__|${ASTERISK_RTP_END}|g" \
    -e "s|__ASTERISK_AMI_USER__|${ASTERISK_AMI_USER}|g" \
    -e "s|__ASTERISK_AMI_SECRET__|${ASTERISK_AMI_SECRET}|g" \
    -e "s|__ASTERISK_ARI_USER__|${ASTERISK_ARI_USER}|g" \
    -e "s|__ASTERISK_ARI_SECRET__|${ASTERISK_ARI_SECRET}|g" \
    -e "s|__ASTERISK_ODBC_DSN__|${ASTERISK_ODBC_DSN}|g" \
    -e "s|__ASTERISK_ODBC_HOST__|${ASTERISK_ODBC_HOST}|g" \
    -e "s|__ASTERISK_ODBC_PORT__|${ASTERISK_ODBC_PORT}|g" \
    -e "s|__ASTERISK_ODBC_DATABASE__|${ASTERISK_ODBC_DATABASE}|g" \
    -e "s|__ASTERISK_ODBC_USER__|${ASTERISK_ODBC_USER}|g" \
    -e "s|__ASTERISK_ODBC_PASSWORD__|${ASTERISK_ODBC_PASSWORD}|g" \
    "${src}" > "${dst}"
}

render "${TEMPLATE_DIR}/pjsip.conf" /etc/asterisk/pjsip.conf
render "${TEMPLATE_DIR}/pjsip.transports.conf" /etc/asterisk/pjsip.transports.conf
render "${TEMPLATE_DIR}/extensions.conf" /etc/asterisk/extensions.conf
render "${TEMPLATE_DIR}/manager.conf" /etc/asterisk/manager.conf
render "${TEMPLATE_DIR}/rtp.conf" /etc/asterisk/rtp.conf
render "${TEMPLATE_DIR}/ari.conf" /etc/asterisk/ari.conf
render "${TEMPLATE_DIR}/http.conf" /etc/asterisk/http.conf
render "${TEMPLATE_DIR}/res_odbc.conf" /etc/asterisk/res_odbc.conf
render "${TEMPLATE_DIR}/extconfig.conf" /etc/asterisk/extconfig.conf
render "${TEMPLATE_DIR}/sorcery.conf" /etc/asterisk/sorcery.conf
render "${TEMPLATE_DIR}/modules.conf" /etc/asterisk/modules.conf
render "${TEMPLATE_DIR}/odbc.ini" /etc/odbc.ini

touch /etc/asterisk/pjsip.endpoints.conf
chown -R asterisk:asterisk /etc/asterisk /var/run/asterisk /var/log/asterisk /var/spool/asterisk

exec "$@"
