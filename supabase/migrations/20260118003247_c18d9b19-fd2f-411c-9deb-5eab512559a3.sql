-- Fase 1: Limpeza do Banco de Dados
-- Remover tabela de movimentações de estoque (não utilizada)
DROP TABLE IF EXISTS public.stock_movements;

-- Remover colunas de estoque da tabela products
ALTER TABLE public.products 
  DROP COLUMN IF EXISTS estoque_atual,
  DROP COLUMN IF EXISTS estoque_minimo;