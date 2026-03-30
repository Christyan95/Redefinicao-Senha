import oracledb from "oracledb";
import path from "path";
import fs from "fs";
import { logger } from "@/lib/logger";

// Controle global para evitar reinicialização múltipla (Hot Reload)
const globalForOracle = global as unknown as { oracleInitialized?: boolean };

// Caminho configurado no .env
const clientPath: string | null = process.env.ORACLE_CLIENT_PATH || process.env.ORACLE_CONFIG_DIR || null;

if (!globalForOracle.oracleInitialized) {
  if (clientPath && typeof oracledb.initOracleClient === "function") {
    try {
      const normalizedPath = path.resolve(clientPath);

      if (fs.existsSync(normalizedPath)) {
        oracledb.initOracleClient({ libDir: normalizedPath });
        logger.info("Oracle Thick Mode ativado via:", normalizedPath);
        globalForOracle.oracleInitialized = true;
      } else {
        logger.warn("Oracle Instant Client path não encontrado:", normalizedPath, "— usando Thin Mode.");
      }
    } catch (err: any) {
      if (err.message.includes("NJS-001")) {
        logger.debug("Oracle Client já inicializado (NJS-001).");
        globalForOracle.oracleInitialized = true;
      } else if (err.message.includes("NJS-045")) {
        logger.error("[ORACLE_INIT]", new Error("Falha de binário (NJS-045). Verifique compatibilidade do node-oracledb."));
      } else {
        logger.error("[ORACLE_INIT]", err);
      }
    }
  } else {
    logger.warn("Oracle Client path não definido. Tentando Thin Mode.");
  }
}

const dbConfig = {
  user: process.env.ORACLE_USER || "",
  password: process.env.ORACLE_PASSWORD || "",
  connectString: process.env.ORACLE_CONNECTION_STRING || "",
};

export class OracleService {
  /**
   * Procura o colaborador no banco Oracle (Tabela PESSOAL).
   * SEGURANÇA: Usa bind variables (:p_user) — imune a SQL Injection.
   */
  static async findEmployee(username: string) {
    let connection;
    try {
      if (!dbConfig.user || !dbConfig.password || !dbConfig.connectString) {
        throw new Error("Oracle configuration missing in .env");
      }

      connection = await oracledb.getConnection(dbConfig);

      const sql = `
        SELECT NOME_PES, NVL(CELU_PES, TELE_PES) as PHONE
        FROM PESSOAL 
        WHERE UPPER(SUBSTR(EMAI_PES, 1, INSTR(EMAI_PES, '@') - 1)) = :p_user
      `;

      const result = await connection.execute(sql, { p_user: username.toUpperCase() });

      // SEGURANÇA: Não logar dados do ERP (result.rows) em produção
      logger.debug(`[ORACLE] Query para ${username}: ${result.rows?.length ?? 0} resultado(s)`);

      if (result.rows && result.rows.length > 0) {
        const [name, rawPhone] = result.rows[0] as [string, string | null];
        const processedPhone = rawPhone ? rawPhone.replace(/[^0-9]/g, "") : null;

        return {
          found: true,
          displayName: name || username,
          mobile: processedPhone && processedPhone.length >= 8 ? processedPhone : null
        };
      }

      return { found: false };

    } catch (error: any) {
      logger.error("[ORACLE_SERVICE]", error);

      if (error.message.includes("NJS-533") || error.message.includes("ORA-12660")) {
        throw new Error("Erro de criptografia: O servidor exige Modo Thick. Verifique o Instant Client.");
      }

      // SEGURANÇA: Nunca expor error.message interno ao cliente
      throw new Error("Erro na conexão com o banco de dados corporativo.");
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          logger.error("[ORACLE_CLOSE]", err);
        }
      }
    }
  }
}
