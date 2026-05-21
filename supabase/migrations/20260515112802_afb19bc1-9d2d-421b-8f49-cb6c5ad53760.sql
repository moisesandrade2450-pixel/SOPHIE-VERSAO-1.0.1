
-- Roles
CREATE TYPE public.app_role AS ENUM ('professor', 'diretora');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users_can_read_own_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Auto-assign default role on signup based on signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  role_text text;
BEGIN
  role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'professor');
  IF role_text NOT IN ('professor', 'diretora') THEN
    role_text := 'professor';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, role_text::public.app_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Avisos (notices)
CREATE TABLE public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id integer NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  enviado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Public read so room screens (no login) receive notices
CREATE POLICY "anyone_can_read_avisos" ON public.avisos
  FOR SELECT TO anon, authenticated USING (true);

-- Only authenticated gestão users (professor or diretora) can send
CREATE POLICY "gestao_can_insert_avisos" ON public.avisos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = enviado_por AND (
      public.has_role(auth.uid(), 'professor') OR
      public.has_role(auth.uid(), 'diretora')
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.avisos;
ALTER TABLE public.avisos REPLICA IDENTITY FULL;
