
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Tipo de agendamento
DO $$ BEGIN
  CREATE TYPE public.tipo_agendamento AS ENUM ('unico', 'diario', 'semanal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela
CREATE TABLE IF NOT EXISTS public.avisos_agendados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  sala_ids integer[] NOT NULL,
  tipo public.tipo_agendamento NOT NULL,
  data_unica timestamptz,
  horarios time[],
  dias_semana integer[],
  ativo boolean NOT NULL DEFAULT true,
  ultima_execucao timestamptz,
  enviado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos_agendados TO authenticated;
GRANT ALL ON public.avisos_agendados TO service_role;

ALTER TABLE public.avisos_agendados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ler_proprios_agendamentos" ON public.avisos_agendados
  FOR SELECT TO authenticated USING (auth.uid() = enviado_por);
CREATE POLICY "criar_agendamentos" ON public.avisos_agendados
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = enviado_por);
CREATE POLICY "atualizar_proprios_agendamentos" ON public.avisos_agendados
  FOR UPDATE TO authenticated USING (auth.uid() = enviado_por);
CREATE POLICY "apagar_proprios_agendamentos" ON public.avisos_agendados
  FOR DELETE TO authenticated USING (auth.uid() = enviado_por);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS set_updated_at_avisos_agendados ON public.avisos_agendados;
CREATE TRIGGER set_updated_at_avisos_agendados
BEFORE UPDATE ON public.avisos_agendados
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Função que processa os agendamentos (SECURITY DEFINER -> bypassa RLS para inserir em avisos)
CREATE OR REPLACE FUNCTION public.processar_avisos_agendados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agora_local timestamp;
  minuto_atual timestamp;
  dow_atual int;
  hora_atual time;
  ag record;
  sid int;
  disparar boolean;
BEGIN
  agora_local := (now() AT TIME ZONE 'America/Sao_Paulo');
  minuto_atual := date_trunc('minute', agora_local);
  dow_atual := EXTRACT(DOW FROM agora_local)::int;
  hora_atual := date_trunc('minute', agora_local)::time;

  FOR ag IN
    SELECT * FROM public.avisos_agendados WHERE ativo = true
  LOOP
    disparar := false;

    IF ag.tipo = 'unico' AND ag.data_unica IS NOT NULL THEN
      IF date_trunc('minute', (ag.data_unica AT TIME ZONE 'America/Sao_Paulo')) = minuto_atual
         AND ag.ultima_execucao IS NULL THEN
        disparar := true;
      END IF;
    ELSIF ag.tipo = 'diario' AND ag.horarios IS NOT NULL THEN
      IF hora_atual = ANY(ag.horarios)
         AND (ag.ultima_execucao IS NULL
              OR date_trunc('minute', (ag.ultima_execucao AT TIME ZONE 'America/Sao_Paulo')) <> minuto_atual) THEN
        disparar := true;
      END IF;
    ELSIF ag.tipo = 'semanal' AND ag.horarios IS NOT NULL AND ag.dias_semana IS NOT NULL THEN
      IF dow_atual = ANY(ag.dias_semana)
         AND hora_atual = ANY(ag.horarios)
         AND (ag.ultima_execucao IS NULL
              OR date_trunc('minute', (ag.ultima_execucao AT TIME ZONE 'America/Sao_Paulo')) <> minuto_atual) THEN
        disparar := true;
      END IF;
    END IF;

    IF disparar THEN
      FOREACH sid IN ARRAY ag.sala_ids LOOP
        INSERT INTO public.avisos (sala_id, titulo, mensagem, enviado_por)
        VALUES (sid, ag.titulo, ag.mensagem, ag.enviado_por);
      END LOOP;

      UPDATE public.avisos_agendados
        SET ultima_execucao = now(),
            ativo = CASE WHEN ag.tipo = 'unico' THEN false ELSE ativo END
      WHERE id = ag.id;
    END IF;
  END LOOP;
END $$;

-- Agenda execução a cada minuto
DO $$
BEGIN
  PERFORM cron.unschedule('processar-avisos-agendados');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'processar-avisos-agendados',
  '* * * * *',
  $cron$ SELECT public.processar_avisos_agendados(); $cron$
);
