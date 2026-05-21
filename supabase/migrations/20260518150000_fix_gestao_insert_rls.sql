-- Corrige envio de avisos: a política usava has_role(), mas EXECUTE foi revogado
-- para authenticated (migration 20260515112825), bloqueando INSERT em avisos.

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
