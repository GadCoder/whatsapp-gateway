import * as qrcode from 'qrcode-terminal';
import type { Logger } from 'pino';
import { Client, LocalAuth, type ClientOptions } from 'whatsapp-web.js';

export interface WhatsAppClientHooks {
  onQr?: (qr: string) => void;
  onReady?: () => void;
  onAuthenticated?: () => void;
  onDisconnected?: (reason: string) => void;
}

export class WhatsAppClientManager {
  readonly client: Client;
  private lifecycleLoggingRegistered = false;

  constructor(
    clientOptions: ClientOptions | undefined,
    private readonly logger: Logger,
    private readonly hooks: WhatsAppClientHooks = {},
    private readonly enableConsoleQr = false
  ) {
    this.client = new Client(
      clientOptions ?? {
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
          ],
        },
      }
    );
  }

  registerLifecycleLogging(): void {
    if (this.lifecycleLoggingRegistered) return;
    this.client.on('qr', (qr: string) => {
      this.logger.info('WhatsApp QR received');
      if (this.enableConsoleQr) {
        qrcode.generate(qr, { small: true });
      }
      this.hooks.onQr?.(qr);
    });

    this.client.on('authenticated', () => {
      this.logger.info('WhatsApp client authenticated');
      this.hooks.onAuthenticated?.();
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error({ message: msg }, 'WhatsApp auth failure');
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn({ reason }, 'WhatsApp client disconnected');
      this.hooks.onDisconnected?.(String(reason));
    });

    this.client.on('ready', () => {
      this.logger.info('WhatsApp client ready');
      this.hooks.onReady?.();
    });

    this.client.on('loading_screen', (percent: number, message: string) => {
      this.logger.info({ percent, message }, 'WhatsApp loading');
    });

    this.client.on('change_state', (state: string) => {
      this.logger.info({ state }, 'WhatsApp state changed');
    });
    this.lifecycleLoggingRegistered = true;
  }

  async initialize(): Promise<void> {
    await this.client.initialize();
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}
