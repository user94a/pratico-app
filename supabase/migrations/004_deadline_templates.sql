-- Crea tabella deadline_templates
CREATE TABLE IF NOT EXISTS public.deadline_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_type asset_type NOT NULL,
  title text NOT NULL,
  default_offset interval NOT NULL,
  default_recurrence text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Popola i template per auto
INSERT INTO public.deadline_templates 
  (asset_type, title, default_offset, default_recurrence, notes)
VALUES
  ('car', 'Bollo', '1 year', 'RRULE:FREQ=YEARLY', 'Pagamento tassa di proprietà'),
  ('car', 'Assicurazione', '1 year', 'RRULE:FREQ=YEARLY', 'Rinnovo polizza RC auto'),
  ('car', 'Revisione', '2 years', 'RRULE:FREQ=YEARLY;INTERVAL=2', 'Revisione obbligatoria'),
  ('car', 'Tagliando', '6 months', 'RRULE:FREQ=MONTHLY;INTERVAL=6', 'Manutenzione ordinaria'),
  ('car', 'Cambio gomme', '6 months', 'RRULE:FREQ=MONTHLY;INTERVAL=6', 'Cambio gomme stagionali');

-- Popola i template per casa
INSERT INTO public.deadline_templates 
  (asset_type, title, default_offset, default_recurrence, notes)
VALUES
  ('house', 'Revisione caldaia', '1 year', 'RRULE:FREQ=YEARLY', 'Manutenzione obbligatoria caldaia'),
  ('house', 'Pulizia canna fumaria', '1 year', 'RRULE:FREQ=YEARLY', 'Pulizia e verifica canna fumaria'),
  ('house', 'Manutenzione climatizzatori', '1 year', 'RRULE:FREQ=YEARLY', 'Pulizia filtri e verifica gas'),
  ('house', 'Controllo tetto/grondaie', '1 year', 'RRULE:FREQ=YEARLY', 'Ispezione tetto e pulizia grondaie'),
  ('house', 'Manutenzione FV', '1 year', 'RRULE:FREQ=YEARLY', 'Manutenzione impianto fotovoltaico');

-- Aggiungi policy per accesso ai template
ALTER TABLE public.deadline_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_templates_read_all" 
  ON public.deadline_templates
  FOR SELECT 
  USING (true); 