-- Abrir gestão para qualquer conta autenticada (sem distinção de papel)
-- 1) Apagar avisos e contas
DELETE FROM public.avisos;
DELETE FROM public.user_roles;
DELETE FROM auth.users;

-- 2) Remover trigger que insere user_roles (causa duplicate key com admin.createUser)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_role_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;

-- 3) Política de INSERT em avisos: qualquer autenticado pode enviar
DROP POLICY IF EXISTS "gestao_can_insert_avisos" ON public.avisos;
CREATE POLICY "authenticated_can_insert_avisos" ON public.avisos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = enviado_por);
