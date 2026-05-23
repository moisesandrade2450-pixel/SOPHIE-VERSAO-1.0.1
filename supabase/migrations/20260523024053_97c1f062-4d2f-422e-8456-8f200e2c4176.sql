
-- Garante que authenticated pode executar a função has_role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Reescreve política de INSERT em avisos sem depender de has_role
DROP POLICY IF EXISTS "gestao_can_insert_avisos" ON public.avisos;

CREATE POLICY "gestao_can_insert_avisos" ON public.avisos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = enviado_por
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('professor'::public.app_role, 'diretora'::public.app_role)
    )
  );
