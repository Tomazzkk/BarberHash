-- Adiciona uma coluna para marcar produtos como destaque
ALTER TABLE public.produtos
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;