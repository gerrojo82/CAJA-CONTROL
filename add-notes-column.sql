-- Agregar columna notes a la tabla closings
ALTER TABLE public.closings ADD COLUMN IF NOT EXISTS notes text;

-- Comentario sobre la columna
COMMENT ON COLUMN public.closings.notes IS 'Notas opcionales sobre el cierre (ej: explicación de diferencias)';
