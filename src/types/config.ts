import type { ConnectionOptions, JobsOptions } from 'bullmq';
import type { ClientOptions } from 'whatsapp-web.js';

export interface DedupeConfig {
  windowMs: number;
}

export interface QueueConfig {
  inboundBase: string;
  outboundCommands: string;
}

export interface LoggingConfig {
  enableConsoleQr?: boolean;
  level?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
}

export interface WhatsAppRuntimeWhatsAppConfig {
  clientOptions?: ClientOptions;
}

export interface WhatsAppRuntimeRedisConfig {
  url?: string;
  connection?: ConnectionOptions;
}

export interface BullMQRuntimeConfig {
  prefix?: string;
  inboundJobOptions?: JobsOptions;
  outboundWorkerConcurrency?: number;
}

export interface WhatsAppMessagingRuntimeConfig {
  whatsapp: WhatsAppRuntimeWhatsAppConfig;
  redis: WhatsAppRuntimeRedisConfig;
  queues: QueueConfig;
  dedupe: DedupeConfig;
  bullmq?: BullMQRuntimeConfig;
  logging?: LoggingConfig;
}
