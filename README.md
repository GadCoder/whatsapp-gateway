# WhatsApp Messaging Runtime

A simple runtime library built on top of `whatsapp-web.js`:

- collects inbound WhatsApp messages
- normalizes and enqueues them into BullMQ queues
- consumes an outbound BullMQ command queue and sends WhatsApp messages
- handles graceful shutdown

## Features

- `whatsapp-web.js` client lifecycle/auth/QR handling
- Inbound message deduplication across `message` and `message_create`
- BullMQ queues for inbound message fan-out and outbound command processing
- `pino` logging
- Process signal handler helpers
- No filtering (all inbound messages are processed)

## Example

```ts
import { WhatsAppMessagingRuntime } from '@gadcoder/whatsapp-gateway';

const runtime = new WhatsAppMessagingRuntime({
  whatsapp: {},
  redis: { url: 'redis://localhost:6379' },
  queues: {
    inboundBase: 'whatsapp.messages.incoming',
    outboundCommands: 'whatsapp.messages.outbound.commands',
  },
  dedupe: { windowMs: 600_000 },
  bullmq: {
    prefix: 'wm',
    outboundWorkerConcurrency: 1,
    inboundJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  },
  logging: { enableConsoleQr: true, level: 'info' },
});

runtime.attachProcessSignalHandlers();
await runtime.start();
```

## Outbound Command Queue Payload (`BullMQ job.data`)

```json
{
  "chatId": "1234567890@c.us",
  "content": "hello from bullmq"
}
```

## Inbound Queue Names

The runtime enqueues inbound messages into queues named by message kind:

- `whatsapp.messages.incoming.text`
- `whatsapp.messages.incoming.image`
- `whatsapp.messages.incoming.video`
- `whatsapp.messages.incoming.audio`
- `whatsapp.messages.incoming.document`
- `whatsapp.messages.incoming.other`
