import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBullMqConnection } from '../utils/bullmq.js';

test('resolveBullMqConnection supports rediss URLs with tls', () => {
  const connection = resolveBullMqConnection({
    url: 'rediss://user:pass@example.com:6380/2',
  }) as Record<string, unknown>;

  assert.equal(connection.host, 'example.com');
  assert.equal(connection.port, 6380);
  assert.equal(connection.username, 'user');
  assert.equal(connection.password, 'pass');
  assert.equal(connection.db, 2);
  assert.deepEqual(connection.tls, {});
});

test('resolveBullMqConnection rejects unsupported protocols', () => {
  assert.throws(
    () => resolveBullMqConnection({ url: 'http://localhost:6379' }),
    /Unsupported Redis URL protocol/
  );
});
