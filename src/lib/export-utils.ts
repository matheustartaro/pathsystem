import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  accessor: string | ((row: Record<string, unknown>) => string | number);
  width?: number;
}

interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

/**
 * Formata valor para moeda brasileira
 */
export function formatCurrencyForExport(value: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}

/**
 * Formata data para exibição
 */
export function formatDateForExport(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

/**
 * Extrai valor de uma célula
 */
function getCellValue(row: Record<string, unknown>, accessor: ExportColumn['accessor']): string {
  if (typeof accessor === 'function') {
    const val = accessor(row);
    return val?.toString() ?? '';
  }
  const keys = accessor.split('.');
  let value: unknown = row;
  for (const key of keys) {
    value = (value as Record<string, unknown>)?.[key];
  }
  return value?.toString() ?? '';
}

/**
 * Exporta dados para PDF
 */
export function exportToPDF({ filename, title, subtitle, columns, data }: ExportOptions): void {
  const doc = new jsPDF();
  
  // Header
  if (title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);
  }
  
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, 14, title ? 28 : 20);
    doc.setTextColor(0);
  }

  // Table data
  const tableHeaders = columns.map(col => col.header);
  const tableData = data.map(row => 
    columns.map(col => getCellValue(row, col.accessor))
  );

  // Generate table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: title && subtitle ? 35 : title ? 28 : 20,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer with date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Gerado em ${formatDateForExport(new Date())} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
}

/**
 * Exporta dados para Excel
 */
export function exportToExcel({ filename, title, columns, data }: ExportOptions): void {
  // Prepare data for worksheet
  const wsData = data.map(row => {
    const rowObj: Record<string, string | number> = {};
    columns.forEach(col => {
      rowObj[col.header] = getCellValue(row, col.accessor);
    });
    return rowObj;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(wsData);

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title || 'Dados');

  // Save
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Hook-friendly export functions for common entities
 */
export const exportHelpers = {
  // Export quotes
  exportQuotes: (quotes: Record<string, unknown>[], format: 'pdf' | 'excel') => {
    const columns: ExportColumn[] = [
      { header: 'Número', accessor: 'numero', width: 12 },
      { header: 'Título', accessor: 'titulo', width: 25 },
      { header: 'Cliente', accessor: (row) => (row.client as Record<string, unknown>)?.nome as string || '-', width: 20 },
      { header: 'Valor', accessor: (row) => formatCurrencyForExport(row.valor_total as number), width: 15 },
      { header: 'Status', accessor: 'status', width: 12 },
      { header: 'Validade', accessor: (row) => formatDateForExport(row.validade as string), width: 12 },
    ];
    
    const options: ExportOptions = {
      filename: `orcamentos_${formatDateForExport(new Date()).replace(/\//g, '-')}`,
      title: 'Relatório de Orçamentos',
      subtitle: `Exportado em ${formatDateForExport(new Date())}`,
      columns,
      data: quotes,
    };

    format === 'pdf' ? exportToPDF(options) : exportToExcel(options);
  },

  // Export transactions
  exportTransactions: (transactions: Record<string, unknown>[], format: 'pdf' | 'excel') => {
    const columns: ExportColumn[] = [
      { header: 'Data', accessor: (row) => formatDateForExport(row.data_vencimento as string), width: 12 },
      { header: 'Descrição', accessor: 'descricao', width: 30 },
      { header: 'Tipo', accessor: (row) => (row.tipo as string) === 'receita' ? 'Receita' : 'Despesa', width: 10 },
      { header: 'Valor', accessor: (row) => formatCurrencyForExport(row.valor as number), width: 15 },
      { header: 'Status', accessor: (row) => (row.status as string) === 'pago' ? 'Pago' : 'Pendente', width: 10 },
    ];
    
    const options: ExportOptions = {
      filename: `transacoes_${formatDateForExport(new Date()).replace(/\//g, '-')}`,
      title: 'Relatório Financeiro',
      subtitle: `Exportado em ${formatDateForExport(new Date())}`,
      columns,
      data: transactions,
    };

    format === 'pdf' ? exportToPDF(options) : exportToExcel(options);
  },

  // Export projects
  exportProjects: (projects: Record<string, unknown>[], format: 'pdf' | 'excel') => {
    const columns: ExportColumn[] = [
      { header: 'Projeto', accessor: 'nome', width: 25 },
      { header: 'Cliente', accessor: 'cliente', width: 20 },
      { header: 'Status', accessor: 'status', width: 12 },
      { header: 'Valor', accessor: (row) => formatCurrencyForExport(row.valor as number), width: 15 },
      { header: 'Progresso', accessor: (row) => `${row.progresso}%`, width: 10 },
      { header: 'Início', accessor: (row) => formatDateForExport(row.data_inicio as string), width: 12 },
      { header: 'Fim', accessor: (row) => formatDateForExport(row.data_fim as string), width: 12 },
    ];
    
    const options: ExportOptions = {
      filename: `projetos_${formatDateForExport(new Date()).replace(/\//g, '-')}`,
      title: 'Relatório de Projetos',
      subtitle: `Exportado em ${formatDateForExport(new Date())}`,
      columns,
      data: projects,
    };

    format === 'pdf' ? exportToPDF(options) : exportToExcel(options);
  },

  // Export clients
  exportClients: (clients: Record<string, unknown>[], format: 'pdf' | 'excel') => {
    const columns: ExportColumn[] = [
      { header: 'Nome', accessor: 'nome', width: 25 },
      { header: 'Email', accessor: 'email', width: 25 },
      { header: 'Telefone', accessor: 'telefone', width: 15 },
      { header: 'Cidade', accessor: 'cidade', width: 15 },
      { header: 'Estado', accessor: 'estado', width: 10 },
    ];
    
    const options: ExportOptions = {
      filename: `clientes_${formatDateForExport(new Date()).replace(/\//g, '-')}`,
      title: 'Relatório de Clientes',
      subtitle: `Exportado em ${formatDateForExport(new Date())}`,
      columns,
      data: clients,
    };

    format === 'pdf' ? exportToPDF(options) : exportToExcel(options);
  },
};
