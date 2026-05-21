-- Permite que o usuário registre o próprio perfil uma vez (fallback se o trigger falhar)
CREATE POLICY "users_insert_own_role_once" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    )
  );
