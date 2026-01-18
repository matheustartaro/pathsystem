-- Adicionar novos valores ao enum app_role se necessário
-- Primeiro vamos criar a tabela de audit_logs para log de auditoria

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (all authenticated users)
CREATE POLICY "Authenticated users can insert audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Criar tabela de templates de projeto
CREATE TABLE IF NOT EXISTS public.project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  categoria text,
  duracao_dias integer DEFAULT 30,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de tarefas do template
CREATE TABLE IF NOT EXISTS public.template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.project_templates(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  descricao text,
  dias_offset_inicio integer DEFAULT 0,
  dias_offset_fim integer DEFAULT 1,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de itens do template (serviços/produtos)
CREATE TABLE IF NOT EXISTS public.template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.project_templates(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL DEFAULT 'service',
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  nome text,
  quantidade integer DEFAULT 1,
  is_manual boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Authenticated users can read templates"
ON public.project_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and managers can manage templates"
ON public.project_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

CREATE POLICY "Authenticated users can read template_tasks"
ON public.template_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and managers can manage template_tasks"
ON public.template_tasks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

CREATE POLICY "Authenticated users can read template_items"
ON public.template_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and managers can manage template_items"
ON public.template_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

-- Trigger para updated_at em project_templates
CREATE TRIGGER update_project_templates_updated_at
BEFORE UPDATE ON public.project_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de tokens de acesso para clientes (Portal do Cliente)
CREATE TABLE IF NOT EXISTS public.client_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.responsaveis(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for client tokens
ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can manage client tokens
CREATE POLICY "Admins can manage client_access_tokens"
ON public.client_access_tokens FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

CREATE POLICY "Authenticated users can read client_access_tokens"
ON public.client_access_tokens FOR SELECT TO authenticated USING (true);

-- Index for token lookup
CREATE INDEX idx_client_access_tokens_token ON public.client_access_tokens(token);
CREATE INDEX idx_client_access_tokens_client_id ON public.client_access_tokens(client_id);

-- Adicionar coluna para vincular quote a projeto quando convertido
-- (já existe converted_project_id na tabela quotes)

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;