
-- 1) Anexar trigger que cria perfil em user_roles ao cadastrar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 2) Política de INSERT em user_roles como fallback (caso o trigger falhe)
DROP POLICY IF EXISTS "users_insert_own_role_once" ON public.user_roles;
CREATE POLICY "users_insert_own_role_once" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    )
  );
