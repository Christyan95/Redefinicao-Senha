import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Gera um OTP criptograficamente seguro de 6 dígitos.
 * Usa crypto.randomInt() em vez de Math.random().
 */
export function generateSecureOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash SHA-256 para armazenamento seguro do OTP.
 * O código nunca é armazenado em texto plano no banco.
 */
export function hashOTP(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Valida complexidade da senha (server-side).
 * Exige pelo menos 3 de 4 critérios: maiúscula, minúscula, número, especial.
 */
export function validatePasswordComplexity(password: string): { valid: boolean; message?: string } {
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { valid: false, message: "Senha inválida (8-128 caracteres)." };
  }

  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const passedCount = checks.filter(Boolean).length;

  if (passedCount < 3) {
    return {
      valid: false,
      message: "A senha deve conter pelo menos 3 dos seguintes: maiúscula, minúscula, número, caractere especial.",
    };
  }

  return { valid: true };
}

/**
 * Valida a origem da requisição (proteção anti-CSRF).
 * Rejeita requisições cross-origin com Origin header diferente do host.
 */
export function validateOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null; // Same-origin requests ou server-to-server

  const allowedHost = req.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    if (originHost !== allowedHost) {
      return NextResponse.json(
        { message: "Origem não autorizada." },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Origem inválida." },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Extrai metadados da requisição para auditoria forense.
 */
export function extractRequestMeta(req: NextRequest) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "0.0.0.0",
    userAgent: req.headers.get("user-agent") || "unknown",
  };
}

/**
 * Sanitiza string para interpolação segura em PowerShell (single-quoted context).
 */
export function sanitizeForPowerShell(value: string): string {
  return value.replace(/'/g, "''");
}
