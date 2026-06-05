import { supabase } from "@/integrations/supabase/client";

export function traduzirErroAuth(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (m.includes("user already registered")) return "Este email já possui conta. Use Entrar.";
  if (m.includes("password should be at least"))
    return "A senha deve ter no mínimo 6 caracteres.";
  if (m.includes("unable to validate email")) return "Email inválido.";
  if (m.includes("email not confirmed"))
    return "Confirme seu email antes de entrar (verifique a caixa de entrada).";
  return mensagem;
}

export async function entrarNaGestao(
  email: string,
  senha: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, error: traduzirErroAuth(error.message) };
  if (!data.session) return { ok: false, error: "Não foi possível iniciar a sessão." };
  return { ok: true, userId: data.session.user.id };
}

export async function criarContaGestao(
  email: string,
  senha: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: `${window.location.origin}/gestao` },
  });
  if (error) return { ok: false, error: traduzirErroAuth(error.message) };

  if (!data.session) {
    const login = await supabase.auth.signInWithPassword({ email, password: senha });
    if (login.error) {
      return {
        ok: false,
        error: "Conta criada. Confirme o email (se solicitado) e depois use Entrar.",
      };
    }
  }
  return { ok: true };
}
