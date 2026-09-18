import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { z } from 'zod';
import { parseData } from '../content/schemas/data';

const recordSchema = z.strictObject({ revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER - 1), envelope: z.unknown() });
export type SaveRecord = { revision: number; envelope: unknown };
export class SaveConflictError extends Error {
  constructor() { super('This save changed in another session. Load it before saving again.'); this.name = 'SaveConflictError'; }
}
export interface SaveRepository {
  read(): Promise<SaveRecord | null>;
  write(envelope: unknown, expectedRevision: number | null): Promise<number>;
  close(): void;
}

interface SaveDatabase extends DBSchema { saves: { key: string; value: SaveRecord } }

/** One versioned slot, isolated from future campaign saves and other tools. */
export function createIndexedDbRepository(name = 'tower-foundation-v1'): SaveRepository {
  let connection: Promise<IDBPDatabase<SaveDatabase>> | undefined;
  let closed = false;
  function connect() {
    if (closed) throw new Error('Save repository is closed.');
    connection ??= openDB<SaveDatabase>(name, 1, {
      upgrade(db) { db.createObjectStore('saves'); },
      blocking() { void connection?.then(db => db.close()); connection = undefined; },
    }).catch(error => { connection = undefined; throw error; });
    return connection;
  }
  return {
    async read() {
      const db = await connect();
      const record = await db.get('saves', 'probe');
      return record === undefined ? null : parseData(recordSchema, record) as SaveRecord;
    },
    async write(envelope, expectedRevision) {
      // Clone before opening the transaction. Validation of game semantics is session-owned.
      const data = structuredClone(envelope);
      const db = await connect();
      const tx = db.transaction('saves', 'readwrite');
      try {
        const existing = await tx.store.get('probe');
        const current = existing === undefined ? null : parseData(recordSchema, existing).revision;
        if (current !== expectedRevision) throw new SaveConflictError();
        const revision = (current ?? 0) + 1;
        parseData(recordSchema, { revision, envelope: data });
        await tx.store.put({ revision, envelope: data }, 'probe');
        await tx.done;
        return revision;
      } catch (error) {
        try { tx.abort(); } catch { /* Already completed or aborted. */ }
        await tx.done.catch(() => undefined);
        throw error;
      }
    },
    close() { closed = true; void connection?.then(db => db.close()).catch(() => undefined); },
  };
}

export function createMemoryRepository(): SaveRepository {
  let record: SaveRecord | null = null;
  let closed = false;
  const checkOpen = () => { if (closed) throw new Error('Save repository is closed.'); };
  return {
    async read() { checkOpen(); return structuredClone(record); },
    async write(envelope, expectedRevision) {
      checkOpen();
      if ((record?.revision ?? null) !== expectedRevision) throw new SaveConflictError();
      const revision = (record?.revision ?? 0) + 1;
      record = { revision, envelope: structuredClone(envelope) };
      return revision;
    },
    close() { closed = true; },
  };
}
