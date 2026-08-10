import { Timestamp } from 'firebase-admin/firestore';

// Converte valores Timestamp do Firestore em strings ISO para a resposta JSON
function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      out[key] = serializeValue(nested);
    }
    return out;
  }
  return value;
}

export function serializeFirestoreData<T>(data: Record<string, unknown>): T {
  return serializeValue(data) as T;
}
