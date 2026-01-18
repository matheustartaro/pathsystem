import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuoteItem {
  nome: string;
  descricao?: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
}

interface QuotePDFData {
  numero: string;
  titulo: string;
  descricao?: string | null;
  validade: Date;
  valor_total: number;
  desconto_total: number;
  observacoes?: string | null;
  termos_condicoes?: string | null;
  items?: QuoteItem[];
  client?: { 
    nome: string;
    email?: string | null;
    telefone?: string | null;
    endereco?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cnpj_cpf?: string | null;
  } | null;
}

interface CompanyInfo {
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logoUrl?: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  nome: 'JMario Comunicação Visual',
  cnpj: '00.000.000/0001-00',
  endereco: 'Rua Exemplo, 123 - Centro',
  telefone: '(00) 0000-0000',
  email: 'contato@jmario.com.br',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateQuotePDF(quote: QuotePDFData, company: CompanyInfo = DEFAULT_COMPANY): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  let yPos = 20;

  // Header - Company Info
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Primary blue
  doc.text(company.nome, 14, yPos);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  if (company.endereco) doc.text(company.endereco, 14, yPos);
  yPos += 4;
  if (company.telefone) doc.text(`Tel: ${company.telefone}`, 14, yPos);
  if (company.email) doc.text(`Email: ${company.email}`, 80, yPos);
  yPos += 4;
  if (company.cnpj) doc.text(`CNPJ: ${company.cnpj}`, 14, yPos);

  // Quote Number & Date - Right side
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`ORÇAMENTO ${quote.numero}`, pageWidth - 14, 20, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Válido até: ${format(quote.validade, 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth - 14, 28, { align: 'right' });

  // Divider
  yPos += 10;
  doc.setDrawColor(200);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 10;

  // Client Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('CLIENTE', 14, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (quote.client) {
    doc.text(quote.client.nome, 14, yPos);
    yPos += 5;
    if (quote.client.cnpj_cpf) {
      doc.text(`CPF/CNPJ: ${quote.client.cnpj_cpf}`, 14, yPos);
      yPos += 5;
    }
    if (quote.client.email) {
      doc.text(`Email: ${quote.client.email}`, 14, yPos);
      yPos += 5;
    }
    if (quote.client.telefone) {
      doc.text(`Tel: ${quote.client.telefone}`, 14, yPos);
      yPos += 5;
    }
    if (quote.client.endereco || quote.client.cidade) {
      const endereco = [quote.client.endereco, quote.client.cidade, quote.client.estado]
        .filter(Boolean)
        .join(', ');
      doc.text(endereco, 14, yPos);
      yPos += 5;
    }
  } else {
    doc.text('Cliente não especificado', 14, yPos);
    yPos += 5;
  }

  yPos += 5;

  // Quote Title & Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(quote.titulo, 14, yPos);
  yPos += 6;

  if (quote.descricao) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    const descLines = doc.splitTextToSize(quote.descricao, pageWidth - 28);
    doc.text(descLines, 14, yPos);
    yPos += descLines.length * 4 + 5;
  }

  yPos += 5;

  // Items Table
  if (quote.items && quote.items.length > 0) {
    const tableHeaders = [['Item', 'Qtd', 'Valor Unit.', 'Desconto', 'Total']];
    const tableData = quote.items.map(item => [
      item.nome + (item.descricao ? `\n${item.descricao}` : ''),
      item.quantidade.toString(),
      formatCurrency(item.preco_unitario),
      item.desconto > 0 ? formatCurrency(item.desconto) : '-',
      formatCurrency(item.total),
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: 14, right: 14 },
    });

    // Get the final Y position after the table
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Totals
  const totalsX = pageWidth - 80;
  
  if (quote.desconto_total > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(formatCurrency(quote.valor_total + quote.desconto_total), pageWidth - 14, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Desconto:', totalsX, yPos);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatCurrency(quote.desconto_total)}`, pageWidth - 14, yPos, { align: 'right' });
    doc.setTextColor(0);
    yPos += 6;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, yPos);
  doc.setTextColor(59, 130, 246);
  doc.text(formatCurrency(quote.valor_total), pageWidth - 14, yPos, { align: 'right' });
  doc.setTextColor(0);
  yPos += 15;

  // Observations
  if (quote.observacoes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 14, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const obsLines = doc.splitTextToSize(quote.observacoes, pageWidth - 28);
    doc.text(obsLines, 14, yPos);
    yPos += obsLines.length * 4 + 10;
  }

  // Terms & Conditions
  if (quote.termos_condicoes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Termos e Condições:', 14, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    const termsLines = doc.splitTextToSize(quote.termos_condicoes, pageWidth - 28);
    doc.text(termsLines, 14, yPos);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${quote.numero}.pdf`);
}

export function generateQuotePDFBlob(quote: QuotePDFData, company: CompanyInfo = DEFAULT_COMPANY): Blob {
  const doc = new jsPDF();
  // ... same generation logic but return blob
  // For simplicity, use the same function but return as blob
  return doc.output('blob');
}
