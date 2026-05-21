-- Cole este arquivo no Supabase → SQL Editor → Run (uma vez).
-- Corrige: "sem permissão" ao enviar aviso mesmo sendo professor/diretora.

-- 1) Permite gravar o próprio perfil no cadastro (fallback)
DROP POLICY IF EXISTS "users_insert_own_role_once" ON public.user_roles;
CREATE POLICY "users_insert_own_role_once" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    )
  );

-- 2) Corrige política de INSERT em avisos (não usa mais has_role())
DROP POLICY IF EXISTS "gestao_can_insert_avisos" ON public.avisos;

CREATE POLICY "gestao_can_insert_avisos" ON public.avisos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = enviado_por
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN (
          'professor'::public.app_role,
          'diretora'::public.app_role
        )
    )
  );
