export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  RECEPTION = 'RECEPTION',
}

export enum UserPresence {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  IN_CALL = 'IN_CALL',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  AWAY = 'AWAY',
  MEETING = 'MEETING',
}

export enum ExtensionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RESERVED = 'RESERVED',
  DISABLED = 'DISABLED',
}

export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING',
}

export enum CallDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  INTERNAL = 'INTERNAL',
}

export enum CallStatus {
  INITIATED = 'INITIATED',
  RINGING = 'RINGING',
  ANSWERED = 'ANSWERED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  REJECTED = 'REJECTED',
  BUSY = 'BUSY',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
  FAILED = 'FAILED',
}

export enum RecordingStatus {
  AVAILABLE = 'AVAILABLE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  FAILED = 'FAILED',
}

export interface Department {
  id: string;
  name: string;
  code: string;
  floor?: number;
  groupExtension?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Extension {
  id: string;
  extensionNumber: string;
  status: ExtensionStatus;
  isReserved: boolean;
  reservedFor?: string;
  displayName?: string;
  sipUsername?: string;
  context?: string;
  allowIncomingCalls: boolean;
  allowOutgoingCalls: boolean;
  allowInternal: boolean;
  allowExternal: boolean;
  allowBroadcast: boolean;
  recordCalls: boolean;
  allowedCodecs: string;
  forwardTo?: string;
  user?: User;
  userId?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  employeeId: string;
  email?: string;
  role: UserRole;
  status: UserPresence;
  cabinet?: string;
  avatarUrl?: string;
  isActive: boolean;
  department?: Department;
  extension?: Extension;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  deviceUuid: string;
  brand: string;
  model: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  androidVersion: string;
  appVersion: string;
  pushToken?: string;
  lastIp?: string;
  lastIpAddress?: string;
  wifiSsid?: string;
  lastSeenAt?: string;
  lastRegistrationAt?: string;
  sipRegistered?: boolean;
  registered?: boolean;
  status: DeviceStatus;
  user: User;
  userId: string;
  extension?: Extension;
  extensionId?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallRecord {
  id: string;
  callUuid: string;
  callerUser?: User;
  calleeUser?: User;
  asteriskUniqueId?: string;
  linkedId?: string;
  callerExtension: string;
  calleeExtension: string;
  sourceExtension?: string;
  destinationExtension?: string;
  direction: CallDirection;
  status: CallStatus;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  billableSeconds?: number;
  hangupCause?: string;
  recordingId?: string;
}

export interface LiveChannel {
  channel: string;
  context: string;
  extension: string;
  priority: string;
  state: string;
  application: string;
  callerId: string;
  accountCode: string;
  bridgeId: string;
  uniqueId: string;
  linkedId: string;
}

export interface Recording {
  id: string;
  callId?: string;
  linkedId?: string;
  asteriskUniqueId?: string;
  callerExtension: string;
  calleeExtension: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  filePath: string;
  fileName: string;
  format: string;
  sizeBytes: string;
  status: RecordingStatus;
  retentionUntil?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
