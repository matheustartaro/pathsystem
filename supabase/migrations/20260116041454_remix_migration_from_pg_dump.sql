CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'funcionario',
    'visualizador'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'nome', new.email), new.email);
  
  -- Primeiro usuário é admin
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'funcionario');
  END IF;
  
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    saldo_inicial numeric DEFAULT 0 NOT NULL,
    saldo_atual numeric DEFAULT 0 NOT NULL,
    banco text,
    agencia text,
    conta text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT accounts_tipo_check CHECK ((tipo = ANY (ARRAY['banco'::text, 'caixa'::text, 'cartao'::text])))
);


--
-- Name: color_palettes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.color_palettes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_name text NOT NULL,
    colors jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    descricao text,
    data_inicio timestamp with time zone NOT NULL,
    data_fim timestamp with time zone,
    dia_todo boolean DEFAULT false,
    cor text DEFAULT '#6366f1'::text,
    project_id uuid,
    client_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: financial_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    cor text DEFAULT '#6366f1'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT financial_categories_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text])))
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    product_id uuid,
    service_id uuid,
    quantidade integer DEFAULT 1 NOT NULL,
    preco_unitario numeric NOT NULL,
    desconto numeric DEFAULT 0 NOT NULL,
    total numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_service_id uuid,
    item_type text DEFAULT 'product'::text NOT NULL,
    is_manual boolean DEFAULT false NOT NULL,
    nome text,
    largura numeric,
    comprimento numeric,
    altura numeric,
    metro_cubico numeric,
    preco_m3 numeric
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_categories_tipo_check CHECK ((tipo = ANY (ARRAY['produto'::text, 'servico'::text])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    custo numeric DEFAULT 0 NOT NULL,
    preco_venda numeric DEFAULT 0 NOT NULL,
    estoque_atual integer DEFAULT 0 NOT NULL,
    estoque_minimo integer DEFAULT 0 NOT NULL,
    unidade text DEFAULT 'un'::text,
    category_id uuid,
    supplier_id uuid,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    markup numeric
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    nome text NOT NULL,
    email text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    cliente text NOT NULL,
    valor numeric(10,2) DEFAULT 0 NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    progresso integer DEFAULT 0 NOT NULL,
    prioridade text DEFAULT 'media'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    responsavel_id uuid,
    producao_inicio date,
    producao_fim date,
    entrega_inicio date,
    entrega_fim date,
    client_id uuid,
    CONSTRAINT projects_prioridade_check CHECK ((prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text]))),
    CONSTRAINT projects_progresso_check CHECK (((progresso >= 0) AND (progresso <= 100)))
);


--
-- Name: responsaveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responsaveis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email text,
    telefone text,
    cargo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cnpj_cpf text,
    endereco text,
    cidade text,
    estado text,
    cep text,
    origem text,
    observacoes text,
    tipo text DEFAULT 'cliente'::text
);


--
-- Name: service_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    horas numeric DEFAULT 1 NOT NULL,
    custo_hora numeric,
    preco_venda numeric DEFAULT 0 NOT NULL,
    category_id uuid,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: status_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_order integer DEFAULT 0,
    show_delay_tag boolean DEFAULT true NOT NULL
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    project_id uuid,
    tipo text NOT NULL,
    quantidade integer NOT NULL,
    motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT stock_movements_tipo_check CHECK ((tipo = ANY (ARRAY['entrada'::text, 'saida'::text])))
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    cnpj text,
    telefone text,
    email text,
    endereco text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value numeric DEFAULT 0 NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    nome text NOT NULL,
    descricao text,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    concluida boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    descricao text NOT NULL,
    valor numeric NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    status text DEFAULT 'pendente'::text NOT NULL,
    category_id uuid,
    account_id uuid,
    project_id uuid,
    client_id uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recorrente boolean DEFAULT false,
    frequencia text,
    dia_vencimento integer,
    recorrencia_fim date,
    recorrencia_parent_id uuid,
    CONSTRAINT transactions_dia_vencimento_check CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31))),
    CONSTRAINT transactions_frequencia_check CHECK ((frequencia = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text]))),
    CONSTRAINT transactions_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'pago'::text, 'cancelado'::text]))),
    CONSTRAINT transactions_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: color_palettes color_palettes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color_palettes
    ADD CONSTRAINT color_palettes_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: financial_categories financial_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: responsaveis responsaveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsaveis
    ADD CONSTRAINT responsaveis_pkey PRIMARY KEY (id);


--
-- Name: service_products service_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_products
    ADD CONSTRAINT service_products_pkey PRIMARY KEY (id);


--
-- Name: service_products service_products_service_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_products
    ADD CONSTRAINT service_products_service_id_product_id_key UNIQUE (service_id, product_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: status_categories status_categories_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_categories
    ADD CONSTRAINT status_categories_key_key UNIQUE (key);


--
-- Name: status_categories status_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_categories
    ADD CONSTRAINT status_categories_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_transactions_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_parent ON public.transactions USING btree (recorrencia_parent_id) WHERE (recorrencia_parent_id IS NOT NULL);


--
-- Name: idx_transactions_recorrente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_recorrente ON public.transactions USING btree (recorrente) WHERE (recorrente = true);


--
-- Name: accounts update_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: financial_categories update_financial_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_financial_categories_updated_at BEFORE UPDATE ON public.financial_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_items update_order_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_categories update_product_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: responsaveis update_responsaveis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_responsaveis_updated_at BEFORE UPDATE ON public.responsaveis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: suppliers update_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events events_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.responsaveis(id);


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: events events_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: order_items order_items_parent_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_parent_service_id_fkey FOREIGN KEY (parent_service_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: order_items order_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.responsaveis(id);


--
-- Name: projects projects_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.responsaveis(id) ON DELETE SET NULL;


--
-- Name: service_products service_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_products
    ADD CONSTRAINT service_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: service_products service_products_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_products
    ADD CONSTRAINT service_products_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: services services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- Name: stock_movements stock_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: transactions transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.financial_categories(id);


--
-- Name: transactions transactions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.responsaveis(id);


--
-- Name: transactions transactions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: transactions transactions_recorrencia_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_recorrencia_parent_id_fkey FOREIGN KEY (recorrencia_parent_id) REFERENCES public.transactions(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_settings Admins can manage system_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage system_settings" ON public.system_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: color_palettes Allow public delete access on color_palettes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access on color_palettes" ON public.color_palettes FOR DELETE USING (true);


--
-- Name: projects Allow public delete access on projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access on projects" ON public.projects FOR DELETE USING (true);


--
-- Name: responsaveis Allow public delete access on responsaveis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access on responsaveis" ON public.responsaveis FOR DELETE USING (true);


--
-- Name: status_categories Allow public delete access on status_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access on status_categories" ON public.status_categories FOR DELETE USING (true);


--
-- Name: tasks Allow public delete access on tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access on tasks" ON public.tasks FOR DELETE USING (true);


--
-- Name: color_palettes Allow public insert access on color_palettes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access on color_palettes" ON public.color_palettes FOR INSERT WITH CHECK (true);


--
-- Name: projects Allow public insert access on projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access on projects" ON public.projects FOR INSERT WITH CHECK (true);


--
-- Name: responsaveis Allow public insert access on responsaveis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access on responsaveis" ON public.responsaveis FOR INSERT WITH CHECK (true);


--
-- Name: status_categories Allow public insert access on status_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access on status_categories" ON public.status_categories FOR INSERT WITH CHECK (true);


--
-- Name: tasks Allow public insert access on tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access on tasks" ON public.tasks FOR INSERT WITH CHECK (true);


--
-- Name: color_palettes Allow public read access on color_palettes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on color_palettes" ON public.color_palettes FOR SELECT USING (true);


--
-- Name: projects Allow public read access on projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on projects" ON public.projects FOR SELECT USING (true);


--
-- Name: responsaveis Allow public read access on responsaveis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on responsaveis" ON public.responsaveis FOR SELECT USING (true);


--
-- Name: status_categories Allow public read access on status_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on status_categories" ON public.status_categories FOR SELECT USING (true);


--
-- Name: tasks Allow public read access on tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on tasks" ON public.tasks FOR SELECT USING (true);


--
-- Name: color_palettes Allow public update access on color_palettes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access on color_palettes" ON public.color_palettes FOR UPDATE USING (true);


--
-- Name: projects Allow public update access on projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access on projects" ON public.projects FOR UPDATE USING (true);


--
-- Name: responsaveis Allow public update access on responsaveis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access on responsaveis" ON public.responsaveis FOR UPDATE USING (true);


--
-- Name: status_categories Allow public update access on status_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access on status_categories" ON public.status_categories FOR UPDATE USING (true);


--
-- Name: tasks Allow public update access on tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access on tasks" ON public.tasks FOR UPDATE USING (true);


--
-- Name: accounts Authenticated users can manage accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage accounts" ON public.accounts TO authenticated USING (true);


--
-- Name: events Authenticated users can manage events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage events" ON public.events TO authenticated USING (true);


--
-- Name: financial_categories Authenticated users can manage financial_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage financial_categories" ON public.financial_categories TO authenticated USING (true);


--
-- Name: order_items Authenticated users can manage order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage order_items" ON public.order_items TO authenticated USING (true);


--
-- Name: product_categories Authenticated users can manage product_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage product_categories" ON public.product_categories TO authenticated USING (true);


--
-- Name: products Authenticated users can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage products" ON public.products TO authenticated USING (true);


--
-- Name: service_products Authenticated users can manage service_products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage service_products" ON public.service_products TO authenticated USING (true);


--
-- Name: services Authenticated users can manage services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage services" ON public.services TO authenticated USING (true);


--
-- Name: stock_movements Authenticated users can manage stock_movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage stock_movements" ON public.stock_movements USING (true);


--
-- Name: suppliers Authenticated users can manage suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers TO authenticated USING (true);


--
-- Name: transactions Authenticated users can manage transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage transactions" ON public.transactions TO authenticated USING (true);


--
-- Name: accounts Authenticated users can read accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read accounts" ON public.accounts FOR SELECT TO authenticated USING (true);


--
-- Name: events Authenticated users can read events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read events" ON public.events FOR SELECT TO authenticated USING (true);


--
-- Name: financial_categories Authenticated users can read financial_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read financial_categories" ON public.financial_categories FOR SELECT TO authenticated USING (true);


--
-- Name: order_items Authenticated users can read order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read order_items" ON public.order_items FOR SELECT TO authenticated USING (true);


--
-- Name: product_categories Authenticated users can read product_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read product_categories" ON public.product_categories FOR SELECT TO authenticated USING (true);


--
-- Name: products Authenticated users can read products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Authenticated users can read profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: user_roles Authenticated users can read roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);


--
-- Name: service_products Authenticated users can read service_products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read service_products" ON public.service_products FOR SELECT TO authenticated USING (true);


--
-- Name: services Authenticated users can read services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read services" ON public.services FOR SELECT TO authenticated USING (true);


--
-- Name: stock_movements Authenticated users can read stock_movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read stock_movements" ON public.stock_movements FOR SELECT USING (true);


--
-- Name: suppliers Authenticated users can read suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);


--
-- Name: system_settings Authenticated users can read system_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read system_settings" ON public.system_settings FOR SELECT TO authenticated USING (true);


--
-- Name: transactions Authenticated users can read transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read transactions" ON public.transactions FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: color_palettes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: product_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: responsaveis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

--
-- Name: service_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: status_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.status_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;