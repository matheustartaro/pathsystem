import { useState, useMemo, useCallback } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { useServices } from '@/hooks/useServices';
import { useProducts } from '@/hooks/useProducts';

export type SearchResultType = 'projeto' | 'cliente' | 'transacao' | 'servico' | 'produto';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
  meta?: Record<string, unknown>;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { projects } = useProjects();
  const { clientes } = useResponsaveis();
  const { transactions } = useFinanceiro();
  const { services } = useServices();
  const { products } = useProducts();

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];

    const searchTerm = query.toLowerCase().trim();
    const allResults: SearchResult[] = [];

    // Search projects
    projects.forEach(project => {
      const matches = 
        project.nome.toLowerCase().includes(searchTerm) ||
        project.cliente.toLowerCase().includes(searchTerm) ||
        project.descricao?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        allResults.push({
          id: project.id,
          type: 'projeto',
          title: project.nome,
          subtitle: `Cliente: ${project.cliente} • ${project.status}`,
          url: `/projetos/${project.id}`,
          meta: { status: project.status, valor: project.valor },
        });
      }
    });

    // Search clients
    clientes.forEach(cliente => {
      const matches = 
        cliente.nome.toLowerCase().includes(searchTerm) ||
        cliente.email?.toLowerCase().includes(searchTerm) ||
        cliente.telefone?.includes(searchTerm) ||
        cliente.cidade?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        allResults.push({
          id: cliente.id,
          type: 'cliente',
          title: cliente.nome,
          subtitle: [cliente.email, cliente.telefone, cliente.cidade].filter(Boolean).join(' • '),
          url: '/clientes',
          meta: { origem: cliente.origem },
        });
      }
    });

    // Search transactions
    transactions.forEach(transaction => {
      const matches = transaction.descricao.toLowerCase().includes(searchTerm);
      
      if (matches) {
        allResults.push({
          id: transaction.id,
          type: 'transacao',
          title: transaction.descricao,
          subtitle: `${transaction.tipo === 'receita' ? 'Receita' : 'Despesa'} • R$ ${transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          url: transaction.tipo === 'receita' ? '/financeiro/receitas' : '/financeiro/despesas',
          meta: { tipo: transaction.tipo, valor: transaction.valor, status: transaction.status },
        });
      }
    });

    // Search services
    services.forEach(service => {
      const matches = 
        service.nome.toLowerCase().includes(searchTerm) ||
        service.descricao?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        allResults.push({
          id: service.id,
          type: 'servico',
          title: service.nome,
          subtitle: `Serviço • R$ ${service.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          url: '/catalogo/servicos',
          meta: { preco: service.preco_venda },
        });
      }
    });

    // Search products
    products.forEach(product => {
      const matches = 
        product.nome.toLowerCase().includes(searchTerm) ||
        product.descricao?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        allResults.push({
          id: product.id,
          type: 'produto',
          title: product.nome,
          subtitle: `Produto • R$ ${product.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          url: '/catalogo/produtos',
          meta: { preco: product.preco_venda },
        });
      }
    });

    // Limit results per category and total
    const grouped = {
      projeto: allResults.filter(r => r.type === 'projeto').slice(0, 5),
      cliente: allResults.filter(r => r.type === 'cliente').slice(0, 5),
      transacao: allResults.filter(r => r.type === 'transacao').slice(0, 5),
      servico: allResults.filter(r => r.type === 'servico').slice(0, 3),
      produto: allResults.filter(r => r.type === 'produto').slice(0, 3),
    };

    return [
      ...grouped.projeto,
      ...grouped.cliente,
      ...grouped.transacao,
      ...grouped.servico,
      ...grouped.produto,
    ];
  }, [query, projects, clientes, transactions, services, products]);

  const groupedResults = useMemo(() => {
    return {
      projeto: results.filter(r => r.type === 'projeto'),
      cliente: results.filter(r => r.type === 'cliente'),
      transacao: results.filter(r => r.type === 'transacao'),
      servico: results.filter(r => r.type === 'servico'),
      produto: results.filter(r => r.type === 'produto'),
    };
  }, [results]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    isOpen,
    open,
    close,
    toggle,
    hasResults: results.length > 0,
  };
}
