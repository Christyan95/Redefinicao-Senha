import axios from "axios";
import { logger } from "@/lib/logger";

export class ZApiService {
  private static readonly INSTANCE = process.env.ZAPI_INSTANCE;
  private static readonly TOKEN = process.env.ZAPI_TOKEN;
  private static readonly CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

  /**
   * Envia o código OTP via Z-API (WhatsApp).
   * SEGURANÇA: Timeout de 10s para evitar hang em caso de falha da API externa.
   */
  static async sendOTP(phone: string, otp: string) {
    if (!this.INSTANCE || !this.TOKEN) {
      logger.warn("[ZAPI] Configurações da Z-API ausentes no .env");
      return false;
    }

    const payload = {
        phone: phone,
        message: `🔐 *Security Reset Password* \n\nSeu código de validação é: *${otp}*`
    };

    try {
        await axios.post(
          `https://api.z-api.io/instances/${this.INSTANCE}/token/${this.TOKEN}/send-text`,
          payload,
          {
            headers: {
              'Client-Token': this.CLIENT_TOKEN || ''
            },
            timeout: 10_000, // 10s timeout
          }
        );
        return true;
    } catch (error: any) {
        logger.error("[ZAPI]", error);
        throw new Error("Falha ao disparar mensagem para o WhatsApp do colaborador.");
    }
  }
}
