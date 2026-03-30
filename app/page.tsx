"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  ChevronRight,
  Lock,
  User,
  Smartphone,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

type Step = "identify" | "otp" | "reset" | "success";

interface PasswordCheck {
  label: string;
  passed: boolean;
}

export default function PasswordReset() {
  const [step, setStep] = useState<Step>("identify");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/identify", { username });
      setMaskedPhone(data.message.split("para ")[1] || "seu WhatsApp");
      setDisplayName(data.displayName || username);
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Não foi possível verificar sua identidade.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError(null);
    try {
      await axios.post("/api/verify", { username, otp });
      setStep("reset");
    } catch (err: any) {
      setError(err.response?.data?.message || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks: PasswordCheck[] = useMemo(() => [
    { label: "Mínimo 8 caracteres", passed: newPassword.length >= 8 },
    { label: "Letra maiúscula", passed: /[A-Z]/.test(newPassword) },
    { label: "Letra minúscula", passed: /[a-z]/.test(newPassword) },
    { label: "Número", passed: /[0-9]/.test(newPassword) },
    { label: "Caractere especial", passed: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const passedCount = passwordChecks.filter(c => c.passed).length;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passedCount < 3) {
      setError("A senha não atende aos requisitos mínimos de segurança.");
      return;
    }
    if (!passwordsMatch) {
      setError("As senhas digitadas não coincidem.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post("/api/reset", { username, otp, newPassword });
      setStep("success");
    } catch (err: any) {
      setError(err.response?.data?.message || "Falha ao redefinir a senha no servidor.");
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    enter: { opacity: 0, y: 20, filter: "blur(4px)" },
    center: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -12, filter: "blur(4px)" },
  };

  const stepLabels = ["Identificação", "Verificação", "Nova Senha", "Concluído"];
  const stepIndex = step === "identify" ? 0 : step === "otp" ? 1 : step === "reset" ? 2 : 3;

  // ── Estilos Inline (Tailwind v4 Safe) ──
  const inputBase = "w-full border rounded-2xl px-4 py-4 outline-none font-medium transition-all duration-300 shadow-sm text-white placeholder:text-white/30";
  const inputGlass = `${inputBase} bg-white/5 border-white/10 backdrop-blur-md focus:border-white/30 focus:ring-4 focus:ring-white/5 focus:bg-white/10 hover:border-white/20`;
  const btnPrimary = "w-full font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100";

  return (
    <div className="w-full max-w-[480px]">

      {/* ─── Painel de Vidro Embaçado (cobre todo o conteúdo) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[32px] px-10 pt-10 pb-8 backdrop-blur-2xl"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.08)"
        }}
      >

        {/* ─── Cabeçalho ─── */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
            }}
          >
            <ShieldCheck className="text-white w-8 h-8" strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-[28px] font-bold text-white tracking-tight drop-shadow-lg"
          >
            Redefinição de Senha
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-white/50 mt-1.5"
          >
            Portal de autoatendimento corporativo
          </motion.p>
        </div>

        {/* ─── Stepper ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-0 mb-8"
        >
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <motion.div
                animate={{
                  scale: i === stepIndex ? 1.1 : 1,
                  boxShadow: i === stepIndex ? "0 0 20px rgba(255,255,255,0.2)" : "none"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 backdrop-blur-sm ${i < stepIndex
                  ? "text-white"
                  : i === stepIndex
                    ? "text-white border border-white/20"
                    : "text-white/30 border border-white/10"
                  }`}
                style={{
                  background: i < stepIndex
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : i === stepIndex
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.03)"
                }}
              >
                {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </motion.div>
              {i < 3 && (
                <div className="w-12 h-[2px] mx-0.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    animate={{ scaleX: i < stepIndex ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="h-full rounded-full origin-left bg-emerald-500"
                  />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* ─── Área do Formulário ─── */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <AnimatePresence mode="wait">

            {/* ═══ STEP 1: Identificação ═══ */}
            {step === "identify" && (
              <motion.form key="s1" variants={pageVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                onSubmit={handleIdentify} className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">Identifique-se</h2>
                  <p className="text-sm text-white/40 mt-1">
                    Insira o seu nome de usuário.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-white/70 transition-colors duration-300" />
                    <input
                      type="text"
                      placeholder="Ex: nome.sobrenome"
                      className={`${inputGlass} pl-12 ${error === "Usuário não localizado no sistema corporativo." ? "text-red-400 !border-red-500/50" : "text-white"}`}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError(null);
                      }}
                      autoFocus
                      required
                    />
                  </div>
                  <AnimatePresence>
                    {error === "Usuário não localizado no sistema corporativo." && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400 font-medium text-center"
                      >
                        O usuário não foi localizado.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <button disabled={loading || !username.trim()} type="submit"
                  className={`${btnPrimary} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] border border-white/10`}
                  style={{
                    background: loading || !username.trim()
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>Continuar <ChevronRight className="h-4 w-4" /></>
                  )}
                </button>
              </motion.form>
            )}

            {/* ═══ STEP 2: Verificação OTP ═══ */}
            {step === "otp" && (
              <motion.form key="s2" variants={pageVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                onSubmit={handleVerifyOtp} className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">Verificação em 2 etapas</h2>
                  <p className="text-sm text-white/40 mt-1">
                    Um código de 6 dígitos foi enviado ao WhatsApp vinculado à sua conta.
                  </p>
                </div>

                <div className="rounded-2xl p-4 flex items-center gap-4 border border-white/10 backdrop-blur-md"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div className="w-11 h-11 bg-blue-500/10 border border-blue-400/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                    <Smartphone className="text-blue-400 h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">{maskedPhone}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Enviado</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className={`${inputGlass} text-center text-2xl tracking-[0.3em] font-bold ${error === "Código incorreto." ? "text-red-400 !border-red-500/50" : "text-white"}`}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ""));
                        if (error) setError(null);
                      }}
                      autoFocus
                      required
                    />
                  </div>
                  <AnimatePresence>
                    {error === "Código incorreto." && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400 font-medium text-center"
                      >
                        O código é inválido
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button disabled={loading || otp.length < 6} type="submit"
                  className={`${btnPrimary} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] border border-white/10`}
                  style={{
                    background: loading || otp.length < 6
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verificar código"}
                </button>
              </motion.form>
            )}

            {/* ═══ STEP 3: Nova Senha ═══ */}
            {step === "reset" && (
              <motion.form key="s3" variants={pageVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                onSubmit={handleReset} className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">Criar nova senha</h2>
                  <p className="text-sm text-white/40 mt-1">
                    Defina uma senha segura para sua conta de rede.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/50 mb-2 block">Nova senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-white/70 transition-colors duration-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      className={`${inputGlass} pl-12 pr-12`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoFocus
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Indicador de Força (Compacto) */}
                {newPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                  >
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scaleX: passedCount >= i ? 1 : 0.5, opacity: passedCount >= i ? 1 : 0.2 }}
                          transition={{ duration: 0.3, delay: i * 0.03 }}
                          className={`h-1.5 flex-1 rounded-full origin-left transition-colors duration-300 ${
                            passedCount >= i
                              ? passedCount <= 2 ? "bg-red-400" : passedCount <= 3 ? "bg-amber-400" : "bg-emerald-400"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[11px] font-medium transition-colors duration-300 ${
                        passedCount <= 2 ? "text-red-400" : passedCount <= 3 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {passedCount <= 1 ? "Fraca" : passedCount === 2 ? "Razoável" : passedCount === 3 ? "Boa" : passedCount === 4 ? "Forte" : "Excelente"}
                      </span>
                      <span className="text-[11px] text-white/20">{passedCount}/5 requisitos</span>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="text-sm font-medium text-white/50 mb-2 block">Confirmar senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-white/70 transition-colors duration-300" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repita a senha"
                      className={`${inputGlass} pl-12 pr-12 ${confirmPassword && (passwordsMatch ? "!border-emerald-500/50" : "!border-red-500/50")}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-200"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {confirmPassword && !passwordsMatch && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-xs text-red-400 mt-2 font-medium text-center"
                      >
                        As senhas não coincidem
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button disabled={loading || passedCount < 3 || !passwordsMatch} type="submit"
                  className={`${btnPrimary} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] border border-white/10`}
                  style={{
                    background: loading || passedCount < 3 || !passwordsMatch
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Redefinir senha"}
                </button>
              </motion.form>
            )}

            {/* ═══ STEP 4: Sucesso ═══ */}
            {step === "success" && (
              <motion.div key="s4"
                initial={{ scale: 0.9, opacity: 0, filter: "blur(6px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-8 space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto backdrop-blur-xl"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    boxShadow: "0 0 40px rgba(16,185,129,0.2)"
                  }}
                >
                  <CheckCircle2 className="text-emerald-400 h-10 w-10" strokeWidth={1.5} />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white">Senha redefinida com sucesso</h2>
                  <p className="text-sm text-white/40 mt-2 leading-relaxed">
                    Sua senha de usuário foi atualizada.<br />
                    Lembre-se de atualizar nos dispositivos conectados.
                  </p>
                </div>
                <button onClick={() => window.location.reload()}
                  className="w-full text-white border border-white/10 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/10 active:scale-[0.97] backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  Voltar ao início
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Bloco de Erro ─── */}
          <AnimatePresence>
            {error && error !== "Código incorreto." && error !== "Usuário não localizado no sistema corporativo." && (
              <motion.div
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 p-4 rounded-2xl flex items-start gap-3 border border-red-500/20 backdrop-blur-sm"
                style={{ background: "rgba(220,38,38,0.1)" }}
              >
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Erro</p>
                  <p className="text-sm text-white/50 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Rodapé (dentro do glass) ─── */}
        <p className="text-center text-xs text-white/25 mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          © 2026 Jee Invest BR · Todos os direitos reservados
        </p>

      </motion.div> {/* Fim do Painel de Vidro */}
    </div>
  );
}
