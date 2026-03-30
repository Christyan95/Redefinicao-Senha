/**
 * Logger configurável com níveis — substitui console.log direto.
 * Em produção, suprime debug logs e stack traces.
 */

const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  /** Debug: Apenas em desenvolvimento. NUNCA imprime em produção. */
  debug: (...args: unknown[]) => {
    if (!isProduction) console.log("[DEBUG]", new Date().toISOString(), ...args);
  },

  /** Info: Eventos operacionais relevantes. */
  info: (...args: unknown[]) => {
    console.log("[INFO]", new Date().toISOString(), ...args);
  },

  /** Warn: Situações inesperadas mas não fatais. */
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", new Date().toISOString(), ...args);
  },

  /** Error: Falhas que requerem investigação. Nunca expõe stack em prod. */
  error: (tag: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ERROR]", new Date().toISOString(), tag, message);
    if (!isProduction && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  },
};
