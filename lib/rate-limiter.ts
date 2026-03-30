/**
 * Rate Limiter em memória — proteção contra brute-force e abuse.
 * Para deploy com múltiplas instâncias (PM2 cluster), substituir por Redis.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Garbage collector: limpa entradas expiradas a cada 60s (previne memory leak)
const globalRef = globalThis as unknown as { __rateLimitGC?: boolean };
if (!globalRef.__rateLimitGC) {
  globalRef.__rateLimitGC = true;
  setInterval(() => {
    const now = Date.now();
    Array.from(store.keys()).forEach((key) => {
      const record = store.get(key);
      if (record && now > record.resetAt) store.delete(key);
    });
  }, 60_000).unref();
}

/**
 * Verifica se a requisição está dentro dos limites permitidos.
 * @returns `true` se permitido, `false` se bloqueado
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

/** Reseta o contador de um key específico (ex: após autenticação bem-sucedida). */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
