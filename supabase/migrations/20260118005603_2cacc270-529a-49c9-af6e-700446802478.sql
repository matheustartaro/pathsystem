-- =============================================
-- FASE 3: Novos Módulos
-- =============================================

-- 1. ORÇAMENTOS/PROPOSTAS
-- =============================================

-- Tabela principal de orçamentos
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(20) NOT NULL,
  client_id UUID REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  validade DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  valor_total NUMERIC NOT NULL DEFAULT 0,
  desconto_total NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  termos_condicoes TEXT,
  converted_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens do orçamento
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'servico',
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at em quotes
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Sequência para número do orçamento
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

-- RLS para quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read quotes" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage quotes" ON public.quotes FOR ALL USING (true);

-- RLS para quote_items
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read quote_items" ON public.quote_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage quote_items" ON public.quote_items FOR ALL USING (true);

-- 2. ARQUIVOS DE PROJETO
-- =============================================

-- Criar bucket de storage para arquivos de projetos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Tabela de arquivos
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outro',
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para project_files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read project_files" ON public.project_files FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project_files" ON public.project_files FOR ALL USING (true);

-- Storage policies
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view project files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete project files"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

-- 3. TIMELINE DE ATIVIDADES
-- =============================================

CREATE TABLE public.project_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  metadata JSONB,
  user_id UUID,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para project_activities
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read project_activities" ON public.project_activities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project_activities" ON public.project_activities FOR ALL USING (true);

-- 4. COMENTÁRIOS EM PROJETOS
-- =============================================

CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  mencoes UUID[] DEFAULT '{}',
  user_id UUID,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at em comments
CREATE TRIGGER update_project_comments_updated_at
BEFORE UPDATE ON public.project_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para project_comments
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read project_comments" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project_comments" ON public.project_comments FOR ALL USING (true);

-- Índices para performance
CREATE INDEX idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX idx_project_activities_project_id ON public.project_activities(project_id);
CREATE INDEX idx_project_activities_created_at ON public.project_activities(created_at DESC);
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_created_at ON public.project_comments(created_at DESC);