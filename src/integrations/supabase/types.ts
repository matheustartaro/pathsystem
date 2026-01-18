export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          conta: string | null
          created_at: string
          id: string
          nome: string
          saldo_atual: number
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      client_access_tokens: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          token: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          token: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      color_palettes: {
        Row: {
          colors: Json
          created_at: string
          group_name: string
          id: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          group_name: string
          id?: string
        }
        Update: {
          colors?: Json
          created_at?: string
          group_name?: string
          id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          client_id: string | null
          cor: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          dia_todo: boolean | null
          id: string
          project_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          dia_todo?: boolean | null
          id?: string
          project_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          dia_todo?: boolean | null
          id?: string
          project_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          altura: number | null
          comprimento: number | null
          created_at: string
          desconto: number
          id: string
          is_manual: boolean
          item_type: string
          largura: number | null
          metro_cubico: number | null
          nome: string | null
          parent_service_id: string | null
          preco_m3: number | null
          preco_unitario: number
          product_id: string | null
          project_id: string
          quantidade: number
          service_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          altura?: number | null
          comprimento?: number | null
          created_at?: string
          desconto?: number
          id?: string
          is_manual?: boolean
          item_type?: string
          largura?: number | null
          metro_cubico?: number | null
          nome?: string | null
          parent_service_id?: string | null
          preco_m3?: number | null
          preco_unitario: number
          product_id?: string | null
          project_id: string
          quantidade?: number
          service_id?: string | null
          total: number
          updated_at?: string
        }
        Update: {
          altura?: number | null
          comprimento?: number | null
          created_at?: string
          desconto?: number
          id?: string
          is_manual?: boolean
          item_type?: string
          largura?: number | null
          metro_cubico?: number | null
          nome?: string | null
          parent_service_id?: string | null
          preco_m3?: number | null
          preco_unitario?: number
          product_id?: string | null
          project_id?: string
          quantidade?: number
          service_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_parent_service_id_fkey"
            columns: ["parent_service_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          ativo: boolean
          category_id: string | null
          created_at: string
          custo: number
          descricao: string | null
          id: string
          markup: number | null
          nome: string
          preco_venda: number
          supplier_id: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          category_id?: string | null
          created_at?: string
          custo?: number
          descricao?: string | null
          id?: string
          markup?: number | null
          nome: string
          preco_venda?: number
          supplier_id?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          category_id?: string | null
          created_at?: string
          custo?: number
          descricao?: string | null
          id?: string
          markup?: number | null
          nome?: string
          preco_venda?: number
          supplier_id?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_activities: {
        Row: {
          created_at: string
          descricao: string
          id: string
          metadata: Json | null
          project_id: string
          tipo: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          metadata?: Json | null
          project_id: string
          tipo: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          tipo?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          mencoes: string[] | null
          parent_id: string | null
          project_id: string
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          mencoes?: string[] | null
          parent_id?: string | null
          project_id: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          mencoes?: string[] | null
          parent_id?: string | null
          project_id?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          categoria: string
          created_at: string
          id: string
          nome: string
          nome_original: string
          project_id: string
          storage_path: string
          tamanho: number
          tipo: string
          uploaded_by: string | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          nome: string
          nome_original: string
          project_id: string
          storage_path: string
          tamanho: number
          tipo: string
          uploaded_by?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          nome?: string
          nome_original?: string
          project_id?: string
          storage_path?: string
          tamanho?: number
          tipo?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          categoria: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          duracao_dias: number | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          duracao_dias?: number | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          duracao_dias?: number | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          cliente: string
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          entrega_fim: string | null
          entrega_inicio: string | null
          id: string
          nome: string
          prioridade: string
          producao_fim: string | null
          producao_inicio: string | null
          progresso: number
          responsavel_id: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          client_id?: string | null
          cliente: string
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          entrega_fim?: string | null
          entrega_inicio?: string | null
          id?: string
          nome: string
          prioridade?: string
          producao_fim?: string | null
          producao_inicio?: string | null
          progresso?: number
          responsavel_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          client_id?: string | null
          cliente?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          entrega_fim?: string | null
          entrega_inicio?: string | null
          id?: string
          nome?: string
          prioridade?: string
          producao_fim?: string | null
          producao_inicio?: string | null
          progresso?: number
          responsavel_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          desconto: number
          descricao: string | null
          id: string
          item_type: string
          nome: string
          preco_unitario: number
          product_id: string | null
          quantidade: number
          quote_id: string
          service_id: string | null
          total: number
        }
        Insert: {
          created_at?: string
          desconto?: number
          descricao?: string | null
          id?: string
          item_type?: string
          nome: string
          preco_unitario?: number
          product_id?: string | null
          quantidade?: number
          quote_id: string
          service_id?: string | null
          total?: number
        }
        Update: {
          created_at?: string
          desconto?: number
          descricao?: string | null
          id?: string
          item_type?: string
          nome?: string
          preco_unitario?: number
          product_id?: string | null
          quantidade?: number
          quote_id?: string
          service_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          converted_project_id: string | null
          created_at: string
          created_by: string | null
          desconto_total: number
          descricao: string | null
          id: string
          numero: string
          observacoes: string | null
          status: string
          termos_condicoes: string | null
          titulo: string
          updated_at: string
          validade: string
          valor_total: number
        }
        Insert: {
          client_id?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by?: string | null
          desconto_total?: number
          descricao?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          status?: string
          termos_condicoes?: string | null
          titulo: string
          updated_at?: string
          validade: string
          valor_total?: number
        }
        Update: {
          client_id?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by?: string | null
          desconto_total?: number
          descricao?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          termos_condicoes?: string | null
          titulo?: string
          updated_at?: string
          validade?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      responsaveis: {
        Row: {
          cargo: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantidade: number
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantidade?: number
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantidade?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          ativo: boolean
          category_id: string | null
          created_at: string
          custo_hora: number | null
          descricao: string | null
          horas: number
          id: string
          nome: string
          preco_venda: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          category_id?: string | null
          created_at?: string
          custo_hora?: number | null
          descricao?: string | null
          horas?: number
          id?: string
          nome: string
          preco_venda?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          category_id?: string | null
          created_at?: string
          custo_hora?: number | null
          descricao?: string | null
          horas?: number
          id?: string
          nome?: string
          preco_venda?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      status_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          key: string
          name: string
          show_delay_tag: boolean
          sort_order: number | null
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          key: string
          name: string
          show_delay_tag?: boolean
          sort_order?: number | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          key?: string
          name?: string
          show_delay_tag?: boolean
          sort_order?: number | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          concluida: boolean
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          nome: string
          project_id: string
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          nome: string
          project_id: string
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          nome?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      template_items: {
        Row: {
          created_at: string
          id: string
          is_manual: boolean | null
          item_type: string
          nome: string | null
          product_id: string | null
          quantidade: number | null
          service_id: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_manual?: boolean | null
          item_type?: string
          nome?: string | null
          product_id?: string | null
          quantidade?: number | null
          service_id?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_manual?: boolean | null
          item_type?: string
          nome?: string | null
          product_id?: string | null
          quantidade?: number | null
          service_id?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_tasks: {
        Row: {
          created_at: string
          descricao: string | null
          dias_offset_fim: number | null
          dias_offset_inicio: number | null
          id: string
          nome: string
          ordem: number | null
          template_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          dias_offset_fim?: number | null
          dias_offset_inicio?: number | null
          id?: string
          nome: string
          ordem?: number | null
          template_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          dias_offset_fim?: number | null
          dias_offset_inicio?: number | null
          id?: string
          nome?: string
          ordem?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          category_id: string | null
          client_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          dia_vencimento: number | null
          frequencia: string | null
          id: string
          observacoes: string | null
          project_id: string | null
          recorrencia_fim: string | null
          recorrencia_parent_id: string | null
          recorrente: boolean | null
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          dia_vencimento?: number | null
          frequencia?: string | null
          id?: string
          observacoes?: string | null
          project_id?: string | null
          recorrencia_fim?: string | null
          recorrencia_parent_id?: string | null
          recorrente?: boolean | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          dia_vencimento?: number | null
          frequencia?: string | null
          id?: string
          observacoes?: string | null
          project_id?: string | null
          recorrencia_fim?: string | null
          recorrencia_parent_id?: string | null
          recorrente?: boolean | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recorrencia_parent_id_fkey"
            columns: ["recorrencia_parent_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "funcionario" | "visualizador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "funcionario", "visualizador"],
    },
  },
} as const
