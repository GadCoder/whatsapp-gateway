export interface OutboundSendCommand {
  chatId: string;
  content: string;
  commandId?: string;
  requestedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface OutboundSendResult {
  ok: boolean;
  chatId: string;
  content: string;
  commandId?: string;
  error?: string;
  sentMessageId?: string;
}
