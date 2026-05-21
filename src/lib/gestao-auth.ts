import { supabase } from "@/integrations/supabase/client";

export type PerfilGestao = "professor" | "diretora";

export function traduzirErroAuth(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Email ou senha incorretos.";
  }
  if (m.includes("user already registered")) {
    return "Este email já possui conta. Use Entrar.";
  }
  if (m.includes("password should be at least")) {
    return "A senha deve ter no mínimo 6 caracteres.";
  }
  if (m.includes("unable to validate email")) {
    return "Email inválido.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar (verifique a caixa de entrada).";
  }
  if (m.includes("permission denied for function has_role")) {
    return "Corrija o banco no Supabase: SQL Editor → cole o arquivo supabase/FIX-ENVIAR-AVISOS.sql → Run. Depois saia e entre de novo.";
  }
  if (m.includes("row-level security") || m.includes("permission denied")) {
    return "Sem permissão para enviar avisos. Confirme que sua conta tem perfil Professor ou Diretora em /gestao.";
  }
  return mensagem;
}

export async function obterPerfilUsuario(userId: string): Promise<PerfilGestao | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.role) return null;
  return data.role as PerfilGestao;
}

/** Garante perfil na tabela user_roles (trigger do banco ou insert de fallback). */
export async function garantirPerfilGestao(
  userId: string,
  perfil: PerfilGestao,
): Promise<{ ok: true; role: PerfilGestao } | { ok: false; error: string }> {
  const existente = await obterPerfilUsuario(userId);
  if (existente) return { ok: true, role: existente };

  const { error } = await supabase.from("user_roles").insert({
    user_id: userId,
    role: perfil,
  });

  if (error) {
    if (error.code === "23505") {
      const role = await obterPerfilUsuario(userId);
      if (role) return { ok: true, role };
    }
    return { ok: false, error: traduzirErroAuth(error.message) };
  }

  return { ok: true, role: perfil };
}

export async function entrarNaGestao(
  email: string,
  senha: string,
): Promise<
  | { ok: true; userId: string; role: PerfilGestao }
  | { ok: false; error: string; needsProfile?: PerfilGestao }
> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, error: traduzirErroAuth(error.message) };
  if (!data.session) return { ok: false, error: "Não foi possível iniciar a sessão." };

  const role = await obterPerfilUsuario(data.session.user.id);
  if (!role) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Conta sem perfil de gestão. Use Criar conta e escolha Professor ou Diretora.",
    };
  }

  return { ok: true, userId: data.session.user.id, role };
}

export async function criarContaGestao(
  email: string,
  senha: string,
  perfil: PerfilGestao,
): Promise<{ ok: true; role: PerfilGestao } | { ok: false; error: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: `${window.location.origin}/gestao`,
      data: { role: perfil },
    },
  });

  if (error) return { ok: false, error: traduzirErroAuth(error.message) };

  let userId = data.session?.user?.id ?? data.user?.id ?? null;

  if (!data.session) {
    const login = await supabase.auth.signInWithPassword({ email, password: senha });
    if (login.error) {
      return {
        ok: false,
        error: "Conta criada. Confirme o email (se solicitado) e depois use Entrar.",
      };
    }
    userId = login.data.session?.user.id ?? null;
  }

  if (!userId) {
    return { ok: false, error: "Conta criada, mas não foi possível obter a sessão. Tente Entrar." };
  }

  const perfilOk = await garantirPerfilGestao(userId, perfil);
  if (!perfilOk.ok) return { ok: false, error: perfilOk.error };

  return { ok: true, role: perfilOk.role };
}

/** Confere se o usuário logado pode inserir avisos (professor ou diretora). */
export async function podeEnviarAvisos(userId: string): Promise<boolean> {
  const role = await obterPerfilUsuario(userId);
  return role === "professor" || role === "diretora";
}
