import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AsteriskManager = require('asterisk-manager');

@Injectable()
export class AsteriskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AsteriskService.name);
  private ami: any;
  private connected = false;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private shuttingDown = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.shuttingDown = true;
    this.clearReconnectTimer();
    this.disconnectAmi();
  }

  private connect() {
    if (this.shuttingDown) return;

    const host = this.config.get('ASTERISK_HOST', '127.0.0.1');
    const port = this.getNumberConfig('ASTERISK_AMI_PORT', 5038);
    const user = this.config.get('ASTERISK_AMI_USER', 'esta_ami_user');
    const secret = this.config.get('ASTERISK_AMI_SECRET', 'esta_ami_password');

    try {
      this.disconnectAmi();
      this.ami = new AsteriskManager(port, host, user, secret, true);

      this.ami.on('connect', () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();
        this.logger.log('Asterisk AMI connected');
      });

      this.ami.on('close', () => {
        this.connected = false;
        this.logger.warn('Asterisk AMI disconnected');
        this.scheduleReconnect();
      });

      this.ami.on('error', (err: Error) => {
        this.connected = false;
        this.logger.warn(`Asterisk AMI error: ${err.message}`);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Asterisk AMI init failed: ${message} - SIP provisioning via AMI will be unavailable`,
      );
      this.scheduleReconnect();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Send an AMI action and return the response
   */
  action(params: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ami || !this.connected) {
        return reject(new Error('Asterisk AMI not connected'));
      }
      this.ami.action(params, (err: Error, res: any) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  /**
   * Create or update a PJSIP endpoint for a user extension.
   * Uses Asterisk AMI UpdateConfig to write pjsip.conf sections.
   */
  async createOrUpdateEndpoint(
    extension: string,
    password: string,
    transport = 'UDP',
    displayName?: string,
  ) {
    if (!this.connected) {
      this.logger.warn(
        `Asterisk not connected — skipping endpoint create for ${extension}`,
      );
      return;
    }

    const endpoint = extension;
    const auth = this.authIdFor(extension);
    const aor = extension; // AOR name must match extension number (REGISTER To header username)
    const transportSection = this.transportSectionFor(transport);

    try {
      await this.deleteCategory(endpoint);
      await this.deleteCategory(auth);
      await this.deleteCategory(aor);

      await this.action({
        Action: 'UpdateConfig',
        SrcFilename: this.pjsipConfigFile(),
        DstFilename: this.pjsipConfigFile(),
        Reload: 'no',
        ...this.updateConfigChanges([
          { action: 'NewCat', cat: endpoint },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'type',
            value: 'endpoint',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'transport',
            value: transportSection,
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'context',
            value: 'internal',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'disallow',
            value: 'all',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'allow',
            value: 'opus,g722,ulaw',
          },
          { action: 'Append', cat: endpoint, variable: 'auth', value: auth },
          { action: 'Append', cat: endpoint, variable: 'aors', value: aor },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'direct_media',
            value: 'no',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'rewrite_contact',
            value: 'yes',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'force_rport',
            value: 'yes',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'rtp_symmetric',
            value: 'yes',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'ice_support',
            value: 'no',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'dtmf_mode',
            value: 'rfc4733',
          },
          {
            action: 'Append',
            cat: endpoint,
            variable: 'callerid',
            value: displayName ? `${displayName} <${extension}>` : `<${extension}>`,
          },

          { action: 'NewCat', cat: auth },
          { action: 'Append', cat: auth, variable: 'type', value: 'auth' },
          {
            action: 'Append',
            cat: auth,
            variable: 'auth_type',
            value: 'userpass',
          },
          {
            action: 'Append',
            cat: auth,
            variable: 'username',
            value: extension,
          },
          {
            action: 'Append',
            cat: auth,
            variable: 'password',
            value: password,
          },

          { action: 'NewCat', cat: aor },
          { action: 'Append', cat: aor, variable: 'type', value: 'aor' },
          { action: 'Append', cat: aor, variable: 'max_contacts', value: '3' },
          {
            action: 'Append',
            cat: aor,
            variable: 'remove_existing',
            value: 'no',
          },
          {
            action: 'Append',
            cat: aor,
            variable: 'qualify_frequency',
            value: '30',
          },
        ]),
      });

      await this.reloadPjsip();
      this.logger.log(`Asterisk endpoint created/updated: ${extension}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to create Asterisk endpoint ${extension}: ${message}`,
      );
    }
  }

  /**
   * Remove a PJSIP endpoint
   */
  async removeEndpoint(extension: string) {
    if (!this.connected) return;
    try {
      await this.deleteCategory(extension); // endpoint section
      await this.deleteCategory(extension); // aor section (same name as endpoint)
      await this.deleteCategory(this.authIdFor(extension));
      await this.deleteCategory(`${extension}-auth`);
      await this.reloadPjsip();
      this.logger.log(`Asterisk endpoint removed: ${extension}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to remove Asterisk endpoint ${extension}: ${message}`,
      );
    }
  }

  /**
   * Reload Asterisk PJSIP module
   */
  async reloadPjsip() {
    if (!this.connected) return;
    try {
      await this.action({ Action: 'Command', Command: 'pjsip reload' });
      this.logger.log('PJSIP reloaded');
    } catch (err) {
      this.logger.warn(`PJSIP reload failed: ${err.message}`);
    }
  }

  async getEndpointRuntimeStatus(extension: string) {
    if (!this.connected) {
      return {
        source: 'ami',
        connected: false,
        registered: false,
        contactCount: 0,
        contacts: [],
      };
    }

    try {
      const response = await this.command('pjsip show contacts');
      const output = this.commandOutput(response);
      const lines = output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.includes(`/${extension}`) || line.includes(` ${extension}/`));

      return {
        source: 'ami',
        connected: true,
        registered: lines.length > 0,
        contactCount: lines.length,
        contacts: lines,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to read endpoint ${extension} status: ${message}`);
      return {
        source: 'ami',
        connected: true,
        registered: false,
        contactCount: 0,
        contacts: [],
      };
    }
  }

  async getLiveChannels() {
    if (!this.connected) return [];

    try {
      const response = await this.command('core show channels concise');
      const output = this.commandOutput(response);
      return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && line.includes('!'))
        .map((line) => {
          const parts = line.split('!');
          return {
            channel: parts[0] ?? '',
            context: parts[1] ?? '',
            extension: parts[2] ?? '',
            priority: parts[3] ?? '',
            state: parts[4] ?? '',
            application: parts[5] ?? '',
            callerId: parts[7] ?? '',
            accountCode: parts[8] ?? '',
            bridgeId: parts[12] ?? '',
            uniqueId: parts[13] ?? '',
            linkedId: parts[14] ?? '',
          };
        });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to read live channels: ${message}`);
      return [];
    }
  }

  private async deleteCategory(category: string) {
    try {
      await this.action({
        Action: 'UpdateConfig',
        SrcFilename: this.pjsipConfigFile(),
        DstFilename: this.pjsipConfigFile(),
        Reload: 'no',
        'Action-000000': 'DelCat',
        'Cat-000000': category,
      });
    } catch {
      // Category may not exist yet; create/update should continue.
    }
  }

  private command(command: string): Promise<any> {
    return this.action({ Action: 'Command', Command: command });
  }

  private commandOutput(response: any): string {
    const output = response?.output ?? response?.Output ?? response?.data ?? '';
    if (Array.isArray(output)) return output.join('\n');
    return String(output);
  }

  private authIdFor(extension: string): string {
    return `auth-${extension}`;
  }

  private updateConfigChanges(
    changes: UpdateConfigChange[],
  ): Record<string, string> {
    return changes.reduce<Record<string, string>>((acc, change, index) => {
      const id = index.toString().padStart(6, '0');
      acc[`Action-${id}`] = change.action;
      acc[`Cat-${id}`] = change.cat;
      if (change.variable) acc[`Var-${id}`] = change.variable;
      if (change.value !== undefined) acc[`Value-${id}`] = change.value;
      return acc;
    }, {});
  }

  private transportSectionFor(transport: string): string {
    const configured = this.config.get<string>(
      'ASTERISK_PJSIP_TRANSPORT_SECTION',
    );
    if (configured) return configured;
    return `transport-${transport.toLowerCase()}`;
  }

  private pjsipConfigFile(): string {
    return this.config.get<string>('ASTERISK_PJSIP_CONFIG_FILE', 'pjsip.conf');
  }

  private scheduleReconnect() {
    if (this.shuttingDown || this.reconnectTimer) return;

    const baseDelayMs = this.getNumberConfig(
      'ASTERISK_AMI_RECONNECT_MS',
      10000,
    );
    const maxDelayMs = this.getNumberConfig(
      'ASTERISK_AMI_RECONNECT_MAX_MS',
      60000,
    );
    const delayMs = Math.min(
      baseDelayMs * Math.max(this.reconnectAttempts + 1, 1),
      maxDelayMs,
    );
    this.reconnectAttempts += 1;
    this.logger.log(
      `Trying to reconnect to AMI in ${Math.round(delayMs / 1000)} seconds`,
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delayMs);
    this.reconnectTimer.unref?.();
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private disconnectAmi() {
    if (!this.ami) return;
    try {
      this.ami.removeAllListeners();
      this.ami.disconnect();
    } catch {
      // Shutdown should not fail because AMI is already unavailable.
    } finally {
      this.ami = undefined;
      this.connected = false;
    }
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = this.config.get<string | number>(key);
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}

interface UpdateConfigChange {
  action: 'NewCat' | 'Append';
  cat: string;
  variable?: string;
  value?: string;
}
