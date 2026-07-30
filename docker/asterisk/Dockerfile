FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends asterisk ca-certificates odbc-postgresql unixodbc \
  && rm -rf /var/lib/apt/lists/*

COPY templates /usr/local/share/esta-asterisk/templates
COPY entrypoint.sh /usr/local/bin/esta-asterisk-entrypoint

RUN chmod +x /usr/local/bin/esta-asterisk-entrypoint \
  && mkdir -p /etc/asterisk /var/run/asterisk /var/log/asterisk /var/spool/asterisk \
  && chown -R asterisk:asterisk /etc/asterisk /var/run/asterisk /var/log/asterisk /var/spool/asterisk

EXPOSE 5038/tcp 5060/udp 8088/tcp 10000-20000/udp

ENTRYPOINT ["/usr/local/bin/esta-asterisk-entrypoint"]
CMD ["asterisk", "-f", "-U", "asterisk", "-G", "asterisk", "-vvv"]
