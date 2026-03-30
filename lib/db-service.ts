import { Pool } from "pg";
import { hashOTP } from "@/lib/security";
import { logger } from "@/lib/logger";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: {
    // SEGURANÇA: Em produção, defina DB_SSL_REJECT_UNAUTHORIZED=true no .env
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;

/**
 * Registra uma ação no log de auditoria forense.
 * O User-Agent é concatenado ao campo DETALHES para compatibilidade de schema.
 */
export async function logAction(
  user: string,
  action: string,
  ip: string,
  status: string,
  details: string,
  userAgent: string = "N/A"
): Promise<void> {
  try {
    const truncatedUA = userAgent.substring(0, 200);
    await pool.query(
      `INSERT INTO "LOG_RDS" ("USUARIO", "ACAO", "IP_ORIG", "STATUS", "DETALHES") VALUES ($1, $2, $3, $4, $5)`,
      [user, action, ip, status, `${details} | UA: ${truncatedUA}`]
    );
  } catch (err) {
    logger.error("[DB_LOG]", err);
  }
}

/**
 * Cria ou substitui o OTP de um usuário.
 * O código é armazenado como hash SHA-256 — NUNCA em texto plano.
 */
export async function upsertOTP(user: string, otp: string, expiresAt: number): Promise<void> {
  const hashedCode = hashOTP(otp);
  await pool.query(`DELETE FROM "OTPS_RDS" WHERE "USERNAME" = $1`, [user]);
  await pool.query(
    `INSERT INTO "OTPS_RDS" ("USERNAME", "CODE", "EXPI_AT") VALUES ($1, $2, $3)`,
    [user, hashedCode, expiresAt]
  );
}

/**
 * Verifica se o OTP informado é válido e não expirou.
 * Comparação via hash SHA-256 do input contra o valor armazenado.
 */
export async function verifyOTP(user: string, code: string): Promise<{ success: boolean; message?: string }> {
  const result = await pool.query(
    `SELECT "CODE", "EXPI_AT" FROM "OTPS_RDS" WHERE "USERNAME" = $1`,
    [user]
  );
  const row = result.rows[0];

  if (!row) return { success: false, message: "Sessão não encontrada." };
  if (Date.now() > Number(row.EXPI_AT)) return { success: false, message: "Código expirado." };

  const hashedInput = hashOTP(code);
  if (row.CODE !== hashedInput) return { success: false, message: "Código incorreto." };

  return { success: true };
}

/** Remove o OTP do usuário após uso bem-sucedido */
export async function clearOTP(user: string): Promise<void> {
  await pool.query(`DELETE FROM "OTPS_RDS" WHERE "USERNAME" = $1`, [user]);
}
