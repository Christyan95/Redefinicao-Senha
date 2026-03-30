import { NextRequest, NextResponse } from "next/server";
import { ADService } from "@/lib/ad-service";
import { verifyOTP, clearOTP, logAction } from "@/lib/db-service";
import { validateOrigin, extractRequestMeta, validatePasswordComplexity } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

/** POST /api/reset — Step 3: Revalida OTP + Redefine a senha no Active Directory */
export async function POST(req: NextRequest) {
  // SEGURANÇA: Validação de origem (anti-CSRF)
  const originError = validateOrigin(req);
  if (originError) return originError;

  const { ip, userAgent } = extractRequestMeta(req);

  // SEGURANÇA: Rate limiting por IP (5 req/min)
  if (!checkRateLimit(`reset:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { message: "Muitas tentativas de redefinição. Aguarde 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const username = body?.username?.trim()?.toLowerCase();
    const otp = body?.otp?.trim();
    const newPassword = body?.newPassword;

    if (!username || !otp || !newPassword) {
      return NextResponse.json({ message: "Dados incompletos para redefinição." }, { status: 400 });
    }

    // SEGURANÇA: Validação de comprimento
    if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json({ message: "Senha inválida (8-128 caracteres)." }, { status: 400 });
    }

    // SEGURANÇA: Validação de complexidade server-side (3 de 4 critérios obrigatórios)
    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.valid) {
      return NextResponse.json({ message: complexity.message }, { status: 400 });
    }

    // 1. Revalidar OTP (double check de segurança — previne replay attacks)
    const otpResult = await verifyOTP(username, otp);
    if (!otpResult.success) {
      await logAction(username, "RESET_SENHA", ip, "FALHA", "Tentativa de reset com OTP inválido.", userAgent);
      return NextResponse.json({ message: "Sessão expirada ou código inválido." }, { status: 403 });
    }

    // 2. Executar reset no Active Directory
    try {
      await ADService.resetPassword(username, newPassword);
    } catch (adError: unknown) {
      const adMessage = adError instanceof Error ? adError.message : "Erro desconhecido no AD";
      logger.error("[AD_RESET]", adError);
      await logAction(username, "RESET_SENHA", ip, "FALHA", `Erro AD: ${adMessage}`, userAgent);

      // Detecção de erro de política de senha (HRESULT: 0x800708C5)
      const isPolicyError =
        adMessage.includes("0x800708C5") ||
        adMessage.includes("diretiva") ||
        adMessage.includes("policy");

      // SEGURANÇA: Nunca expor mensagem interna do AD ao cliente
      const clientMessage = isPolicyError
        ? "A senha não atende aos requisitos de segurança do domínio (comprimento, complexidade ou histórico)."
        : "Erro ao processar redefinição no servidor de rede.";

      return NextResponse.json({ message: clientMessage }, { status: 403 });
    }

    // 3. Sucesso: Limpar OTP e registrar
    await clearOTP(username);
    await logAction(username, "RESET_SENHA", ip, "SUCESSO", "Senha redefinida via autoatendimento.", userAgent);

    return NextResponse.json({ success: true, message: "Senha alterada com sucesso." });
  } catch (error: unknown) {
    logger.error("[API_RESET]", error);
    return NextResponse.json({ message: "Erro ao processar redefinição." }, { status: 500 });
  }
}
