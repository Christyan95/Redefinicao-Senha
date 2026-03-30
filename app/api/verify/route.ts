import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, clearOTP, logAction } from "@/lib/db-service";
import { validateOrigin, extractRequestMeta } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

/** POST /api/verify — Step 2: Valida o código OTP enviado via WhatsApp */
export async function POST(req: NextRequest) {
  // SEGURANÇA: Validação de origem (anti-CSRF)
  const originError = validateOrigin(req);
  if (originError) return originError;

  const { ip, userAgent } = extractRequestMeta(req);

  // SEGURANÇA: Rate limiting por IP (10 req/min)
  if (!checkRateLimit(`verify:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const username = body?.username?.trim()?.toLowerCase();
    const otp = body?.otp?.trim();

    if (!username || typeof username !== "string" || !otp || typeof otp !== "string") {
      return NextResponse.json({ message: "Usuário e código são obrigatórios." }, { status: 400 });
    }

    // Validação de formato: OTP deve ser exatamente 6 dígitos
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ message: "Formato de código inválido." }, { status: 400 });
    }

    // SEGURANÇA: Limite de tentativas por usuário (5 tentativas por sessão OTP de 10 min)
    // Após exceder, o OTP é invalidado e o usuário precisa solicitar um novo
    if (!checkRateLimit(`otp-attempt:${username}`, 5, 10 * 60 * 1000)) {
      await clearOTP(username);
      await logAction(username, "VALIDACAO_OTP", ip, "BLOQUEADO", "Máximo de tentativas excedido. OTP invalidado.", userAgent);
      return NextResponse.json(
        { message: "Máximo de tentativas excedido. Solicite um novo código." },
        { status: 429 }
      );
    }

    const result = await verifyOTP(username, otp);

    if (!result.success) {
      await logAction(username, "VALIDACAO_OTP", ip, "FALHA", result.message || "Código incorreto.", userAgent);
      return NextResponse.json({ message: result.message || "Código incorreto." }, { status: 400 });
    }

    await logAction(username, "VALIDACAO_OTP", ip, "SUCESSO", "Código validado com sucesso.", userAgent);
    return NextResponse.json({ success: true, message: "Código validado com sucesso." });
  } catch (error: unknown) {
    logger.error("[API_VERIFY]", error);
    return NextResponse.json({ message: "Erro interno ao validar código." }, { status: 500 });
  }
}
