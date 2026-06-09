GRANT SELECT ON public.avisos TO anon;
GRANT SELECT, INSERT ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;

DROP POLICY IF EXISTS authenticated_can_insert_avisos ON public.avisos;
CREATE POLICY authenticated_users_can_send_avisos
ON public.avisos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = enviado_por);

GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;