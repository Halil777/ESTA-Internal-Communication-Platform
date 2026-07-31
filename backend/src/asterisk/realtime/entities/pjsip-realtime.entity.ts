import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('ps_endpoints')
export class PjsipEndpoint {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ nullable: true, length: 80 })
  transport: string;

  @Column({ nullable: true, length: 80 })
  aors: string;

  @Column({ nullable: true, length: 80 })
  auth: string;

  @Column({ nullable: true, length: 80 })
  context: string;

  @Column({ nullable: true, length: 200 })
  disallow: string;

  @Column({ nullable: true, length: 200 })
  allow: string;

  @Column({ name: 'direct_media', nullable: true, length: 10 })
  directMedia: string;

  @Column({ name: 'rewrite_contact', nullable: true, length: 10 })
  rewriteContact: string;

  @Column({ name: 'force_rport', nullable: true, length: 10 })
  forceRport: string;

  @Column({ name: 'rtp_symmetric', nullable: true, length: 10 })
  rtpSymmetric: string;

  @Column({ name: 'ice_support', nullable: true, length: 10 })
  iceSupport: string;

  @Column({ name: 'dtmf_mode', nullable: true, length: 30 })
  dtmfMode: string;

  @Column({ nullable: true, length: 200 })
  callerid: string;

  @Column({ name: 'webrtc', nullable: true, length: 10 })
  webRtc: string;

  @Column({ name: 'media_encryption', nullable: true, length: 40 })
  mediaEncryption: string;

  @Column({ name: 'device_state_busy_at', nullable: true })
  deviceStateBusyAt: number;

  @Column({ name: 'allow_subscribe', nullable: true, length: 10 })
  allowSubscribe: string;

  @Column({ name: 'send_pai', nullable: true, length: 10 })
  sendPai: string;

  @Column({ name: 'send_rpid', nullable: true, length: 10 })
  sendRpid: string;

  @Column({ name: 'trust_id_inbound', nullable: true, length: 10 })
  trustIdInbound: string;

  @Column({ name: 'trust_id_outbound', nullable: true, length: 10 })
  trustIdOutbound: string;
}

@Entity('ps_auths')
export class PjsipAuth {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ name: 'auth_type', nullable: true, length: 40 })
  authType: string;

  @Column({ nullable: true, length: 80 })
  username: string;

  @Column({ nullable: true, type: 'text' })
  password: string;

  @Column({ nullable: true, length: 120 })
  realm: string;

  @Column({ name: 'nonce_lifetime', nullable: true })
  nonceLifetime: number;
}

@Entity('ps_aors')
export class PjsipAor {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ nullable: true, type: 'text' })
  contact: string;

  @Column({ nullable: true, length: 80 })
  mailboxes: string;

  @Column({ name: 'default_expiration', nullable: true })
  defaultExpiration: number;

  @Column({ name: 'maximum_expiration', nullable: true })
  maximumExpiration: number;

  @Column({ name: 'minimum_expiration', nullable: true })
  minimumExpiration: number;

  @Column({ name: 'max_contacts', nullable: true })
  maxContacts: number;

  @Column({ name: 'remove_existing', nullable: true, length: 10 })
  removeExisting: string;

  @Column({ name: 'outbound_proxy', nullable: true, length: 255 })
  outboundProxy: string;

  @Column({ name: 'qualify_frequency', nullable: true })
  qualifyFrequency: number;

  @Column({ name: 'qualify_timeout', nullable: true, type: 'real' })
  qualifyTimeout: number;

  @Column({ name: 'authenticate_qualify', nullable: true, length: 10 })
  authenticateQualify: string;

  @Column({ name: 'support_path', nullable: true, length: 10 })
  supportPath: string;

  @Column({ name: 'voicemail_extension', nullable: true, length: 40 })
  voicemailExtension: string;

  @Column({ name: 'remove_unavailable', nullable: true, length: 10 })
  removeUnavailable: string;

  @Column({ name: 'qualify_2xx_only', nullable: true, length: 10 })
  qualify2xxOnly: string;
}

@Entity('ps_contacts')
@Index(['endpoint'])
export class PjsipContact {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ nullable: true, length: 80 })
  endpoint: string;

  @Column({ nullable: true, length: 511 })
  uri: string;

  @Column({ name: 'expiration_time', nullable: true, type: 'bigint' })
  expirationTime: string;

  @Column({ name: 'qualify_frequency', nullable: true })
  qualifyFrequency: number;

  @Column({ name: 'qualify_timeout', nullable: true, type: 'real' })
  qualifyTimeout: number;

  @Column({ name: 'outbound_proxy', nullable: true, length: 255 })
  outboundProxy: string;

  @Column({ nullable: true, type: 'text' })
  path: string;

  @Column({ name: 'user_agent', nullable: true, length: 255 })
  userAgent: string;

  @Column({ name: 'via_addr', nullable: true, length: 45 })
  viaAddr: string;

  @Column({ name: 'via_port', nullable: true })
  viaPort: number;

  @Column({ name: 'call_id', nullable: true, type: 'text' })
  callId: string;

  @Column({ name: 'reg_server', nullable: true, length: 255 })
  regServer: string;

  @Column({ name: 'authenticate_qualify', nullable: true, length: 10 })
  authenticateQualify: string;

  @Column({ name: 'prune_on_boot', nullable: true, length: 10 })
  pruneOnBoot: string;

  @Column({ name: 'qualify_2xx_only', nullable: true, length: 10 })
  qualify2xxOnly: string;

  @Column({ nullable: true, length: 40 })
  status: string;

  @Column({ nullable: true })
  rtt: number;
}

@Entity('ps_endpoint_id_ips')
export class PjsipEndpointIdIp {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ nullable: true, length: 80 })
  endpoint: string;

  @Column({ nullable: true, type: 'text' })
  match: string;

  @Column({ name: 'srv_lookups', nullable: true, length: 10 })
  srvLookups: string;

  @Column({ name: 'match_header', nullable: true, type: 'text' })
  matchHeader: string;
}

@Entity('ps_transports')
export class PjsipTransport {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ nullable: true, length: 20 })
  protocol: string;

  @Column({ nullable: true, length: 80 })
  bind: string;

  @Column({ name: 'external_media_address', nullable: true, length: 80 })
  externalMediaAddress: string;

  @Column({ name: 'external_signaling_address', nullable: true, length: 80 })
  externalSignalingAddress: string;

  @Column({ name: 'external_signaling_port', nullable: true, type: 'integer' })
  externalSignalingPort: number;

  @Column({ name: 'local_net', nullable: true, type: 'text' })
  localNet: string;

  @Column({ nullable: true, length: 20 })
  method: string;

  @Column({ name: 'cert_file', nullable: true, type: 'text' })
  certFile: string;

  @Column({ name: 'priv_key_file', nullable: true, type: 'text' })
  privKeyFile: string;

  @Column({ name: 'ca_list_file', nullable: true, type: 'text' })
  caListFile: string;

  @Column({ nullable: true, type: 'text' })
  cipher: string;

  @Column({ name: 'verify_client', nullable: true, length: 10 })
  verifyClient: string;

  @Column({ name: 'verify_server', nullable: true, length: 10 })
  verifyServer: string;
}

@Entity('ps_registrations')
export class PjsipRegistration {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ name: 'client_uri', nullable: true, type: 'text' })
  clientUri: string;

  @Column({ name: 'server_uri', nullable: true, type: 'text' })
  serverUri: string;

  @Column({ nullable: true, length: 80 })
  transport: string;

  @Column({ name: 'outbound_auth', nullable: true, length: 80 })
  outboundAuth: string;

  @Column({ name: 'retry_interval', nullable: true })
  retryInterval: number;

  @Column({ name: 'forbidden_retry_interval', nullable: true })
  forbiddenRetryInterval: number;

  @Column({ name: 'expiration', nullable: true })
  expiration: number;
}

@Entity('ps_domain_aliases')
export class PjsipDomainAlias {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ nullable: true, length: 80 })
  domain: string;
}

@Entity('ps_globals')
export class PjsipGlobal {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  id: string;

  @Column({ name: 'user_agent', nullable: true, length: 120 })
  userAgent: string;

  @Column({ name: 'default_outbound_endpoint', nullable: true, length: 80 })
  defaultOutboundEndpoint: string;

  @Column({ name: 'debug', nullable: true, length: 10 })
  debug: string;
}

@Entity('ps_subscription_persistence')
export class PjsipSubscriptionPersistence {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ nullable: true, type: 'text' })
  packet: string;

  @Column({ name: 'src_name', nullable: true, length: 128 })
  srcName: string;

  @Column({ name: 'src_port', nullable: true })
  srcPort: number;

  @Column({ name: 'transport_key', nullable: true, length: 64 })
  transportKey: string;
}
