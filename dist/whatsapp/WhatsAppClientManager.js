import * as qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
export class WhatsAppClientManager {
    logger;
    hooks;
    enableConsoleQr;
    client;
    lifecycleLoggingRegistered = false;
    constructor(clientOptions, logger, hooks = {}, enableConsoleQr = false) {
        this.logger = logger;
        this.hooks = hooks;
        this.enableConsoleQr = enableConsoleQr;
        this.client = new Client(clientOptions ?? {
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
        });
    }
    registerLifecycleLogging() {
        if (this.lifecycleLoggingRegistered)
            return;
        this.client.on('qr', (qr) => {
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
        this.client.on('loading_screen', (percent, message) => {
            this.logger.info({ percent, message }, 'WhatsApp loading');
        });
        this.client.on('change_state', (state) => {
            this.logger.info({ state }, 'WhatsApp state changed');
        });
        this.lifecycleLoggingRegistered = true;
    }
    async initialize() {
        await this.client.initialize();
    }
    async destroy() {
        await this.client.destroy();
    }
}
//# sourceMappingURL=WhatsAppClientManager.js.map