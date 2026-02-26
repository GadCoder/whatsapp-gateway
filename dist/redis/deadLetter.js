import { mkdir, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
export async function writeDeadLetterRecord(path, topic, payload, reason) {
    await mkdir(dirname(path), { recursive: true });
    const record = {
        timestamp: new Date().toISOString(),
        reason,
        topic,
        payload,
    };
    await appendFile(path, `${JSON.stringify(record)}\n`, 'utf8');
}
//# sourceMappingURL=deadLetter.js.map