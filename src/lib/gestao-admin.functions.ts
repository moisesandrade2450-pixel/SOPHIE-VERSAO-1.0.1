import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMAIL_DOMAIN = "escola.edu.br";
const emailEscola = z
  .string()
  .email()
  .max(255)
  .refine((v) => v.toLowerCase().endsWith(`@${EMAIL_DOMAIN}`), {
    message: `O e-mail precisa terminar com @${EMAIL_DOMAIN}`,
  });

const NovaContaSchema = z.object({
  email: emailEscola,
  senha: z.string().min(6).max(72),
  perfil: z.enum(["professor", "diretora"]),
});

/** Diretora cria conta de professor ou outra diretora. */
export const criarContaPeloPainel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => NovaContaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: meuRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (meuRole?.role !== "diretora") {
      throw new Error("Apenas a diretora pode criar contas.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { role: data.perfil },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Falha ao criar conta.");
    }

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.perfil });
    if (roleErr && roleErr.code !== "23505") {
      throw new Error(roleErr.message);
    }

    return { ok: true, email: data.email, perfil: data.perfil };
  });

/** Cria a primeira diretora (sem auth). Só funciona se ainda não existir nenhuma. */
export const criarPrimeiraDiretora = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ email: z.string().email().max(255), senha: z.string().min(6).max(72) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "diretora");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
      throw new Error("Já existe uma diretora cadastrada. Peça para ela criar sua conta.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { role: "diretora" },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Falha ao criar conta.");
    }

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "diretora" });
    if (roleErr && roleErr.code !== "23505") {
      throw new Error(roleErr.message);
    }

    return { ok: true };
  });

/** Lista contas (somente diretora). */
export const listarContasGestao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: meuRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (meuRole?.role !== "diretora") {
      throw new Error("Apenas a diretora pode ver as contas.");
    }

    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (roles ?? []).map((r) => r.user_id);
    const emails = new Map<string, string>();
    for (const id of ids) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id);
      if (data.user?.email) emails.set(id, data.user.email);
    }

    return (roles ?? []).map((r) => ({
      user_id: r.user_id,
      role: r.role as "professor" | "diretora",
      email: emails.get(r.user_id) ?? "(sem email)",
      created_at: r.created_at,
    }));
  });
