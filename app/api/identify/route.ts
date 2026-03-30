import { NextRequest, NextResponse } from "next/server";
import { OracleService } from "@/lib/oracle-service";
import { ADService } from "@/lib/ad-service";
import { ZApiService } from "@/lib/zapi-service";
import { upsertOTP, logAction } from "@/lib/db-service";
import { generateSecureOTP, validateOrigin, extractRequestMeta } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

/** POST /api/identify — Step 1: Identifica o colaborador via Oracle + AD e envia OTP via WhatsApp */
export async function POST(req: NextRequest) {
  // SEGURANÇA: Validação de origem (anti-CSRF)
  const originError = validateOrigin(req);
  if (originError) return originError;

  const { ip, userAgent } = extractRequestMeta(req);

  // SEGURANÇA: Rate limiting por IP (5 tentativas por minuto)
  if (!checkRateLimit(`identify:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const rawUsername = body?.username;

    if (!rawUsername || typeof rawUsername !== "string") {
      return NextResponse.json({ message: "Usuário é obrigatório." }, { status: 400 });
    }

    // Sanitização: apenas alfanuméricos, ponto e underscore (padrão sAMAccountName do AD)
    const username = rawUsername.trim().toLowerCase();
    if (!/^[a-z0-9._]{2,64}$/.test(username)) {
      return NextResponse.json({ message: "Formato de usuário inválido." }, { status: 400 });
    }

    // Rate limiting por username (10 tentativas por hora — anti user-enumeration)
    if (!checkRateLimit(`identify-user:${username}`, 10, 3_600_000)) {
      return NextResponse.json(
        { message: "Muitas tentativas para este usuário. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    // ETAPA 1: Identificação via Oracle ERP
    const employee = await OracleService.findEmployee(username);
    if (!employee.found) {
      await logAction(username, "BUSCA_ORACLE", ip, "FALHA", "Usuário não localizado no Oracle.", userAgent);
      return NextResponse.json({ message: "Usuário não localizado no sistema corporativo." }, { status: 404 });
    }

    if (!employee.mobile) {
      await logAction(username, "BUSCA_ORACLE", ip, "FALHA", "Colaborador sem celular cadastrado.", userAgent);
      return NextResponse.json({ message: "Colaborador sem telefone celular para validação." }, { status: 404 });
    }

    // ETAPA 2: Verificação no Active Directory
    const adUser = await ADService.findUser(username);
    if (!adUser.found) {
      await logAction(username, "BUSCA_AD", ip, "FALHA", "Conta inexistente no Active Directory.", userAgent);
      return NextResponse.json({ message: "Conta inativa no sistema de rede. Procure o suporte." }, { status: 404 });
    }

    // ETAPA 3: Geração criptograficamente segura e envio do OTP
    const otp = generateSecureOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

    await upsertOTP(username, otp, expiresAt);

    const phone = employee.mobile.startsWith("55") ? employee.mobile : `55${employee.mobile}`;
    await ZApiService.sendOTP(phone, otp);

    await logAction(username, "ENVIO_OTP", ip, "SUCESSO", "Código enviado via WhatsApp.", userAgent);

    const masked = phone.slice(0, 4) + "****" + phone.slice(-4);

    return NextResponse.json({
      success: true,
      message: `Código enviado para ${masked}`,
      displayName: employee.displayName,
    });
  } catch (error: unknown) {
    logger.error("[API_IDENTIFY]", error);
    return NextResponse.json({ message: "Erro ao processar identidade." }, { status: 500 });
  }
}
