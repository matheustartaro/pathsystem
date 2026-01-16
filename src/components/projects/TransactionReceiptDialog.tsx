import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/hooks/useFinanceiro';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';

interface TransactionReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function TransactionReceiptDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionReceiptDialogProps) {
  const { projects } = useProjects();
  const { responsaveis } = useResponsaveis();

  if (!transaction) return null;

  const project = projects.find(p => p.id === transaction.project_id);
  const client = responsaveis.find(r => r.id === transaction.client_id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${transaction.descricao}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              max-width: 800px; 
              margin: 0 auto;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding-bottom: 20px; 
              border-bottom: 2px solid #333; 
            }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { color: #666; }
            .section { margin-bottom: 20px; }
            .section-title { 
              font-weight: bold; 
              font-size: 14px; 
              color: #666; 
              margin-bottom: 8px; 
              text-transform: uppercase;
            }
            .row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0; 
              border-bottom: 1px solid #eee; 
            }
            .row:last-child { border-bottom: none; }
            .label { color: #666; }
            .value { font-weight: 500; }
            .amount { 
              font-size: 28px; 
              font-weight: bold; 
              text-align: center; 
              padding: 20px; 
              margin: 20px 0;
              background: #f5f5f5;
              border-radius: 8px;
            }
            .amount.income { color: #16a34a; }
            .amount.expense { color: #dc2626; }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 2px solid #333; 
              text-align: center;
            }
            .signature { 
              margin-top: 60px; 
              text-align: center; 
            }
            .signature-line { 
              width: 300px; 
              border-bottom: 1px solid #333; 
              margin: 0 auto 10px; 
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RECIBO</h1>
            <p>${transaction.tipo === 'receita' ? 'Recebimento' : 'Pagamento'}</p>
          </div>
          
          <div class="amount ${transaction.tipo === 'receita' ? 'income' : 'expense'}">
            ${formatCurrency(transaction.valor)}
          </div>

          <div class="section">
            <div class="section-title">Informações</div>
            <div class="row">
              <span class="label">Descrição:</span>
              <span class="value">${transaction.descricao}</span>
            </div>
            <div class="row">
              <span class="label">Tipo:</span>
              <span class="value">${transaction.tipo === 'receita' ? 'Receita' : 'Despesa'}</span>
            </div>
            <div class="row">
              <span class="label">Data de Vencimento:</span>
              <span class="value">${format(new Date(transaction.data_vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            ${transaction.data_pagamento ? `
            <div class="row">
              <span class="label">Data de Pagamento:</span>
              <span class="value">${format(new Date(transaction.data_pagamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            ` : ''}
            <div class="row">
              <span class="label">Status:</span>
              <span class="value">${transaction.status === 'pago' ? 'Pago' : transaction.status === 'pendente' ? 'Pendente' : 'Cancelado'}</span>
            </div>
          </div>

          ${project ? `
          <div class="section">
            <div class="section-title">Projeto</div>
            <div class="row">
              <span class="label">Nome:</span>
              <span class="value">${project.nome}</span>
            </div>
            <div class="row">
              <span class="label">Cliente:</span>
              <span class="value">${project.cliente}</span>
            </div>
          </div>
          ` : ''}

          ${client ? `
          <div class="section">
            <div class="section-title">Cliente</div>
            <div class="row">
              <span class="label">Nome:</span>
              <span class="value">${client.nome}</span>
            </div>
            ${client.cnpj_cpf ? `
            <div class="row">
              <span class="label">CPF/CNPJ:</span>
              <span class="value">${client.cnpj_cpf}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${transaction.observacoes ? `
          <div class="section">
            <div class="section-title">Observações</div>
            <p>${transaction.observacoes}</p>
          </div>
          ` : ''}

          <div class="signature">
            <div class="signature-line"></div>
            <p>Assinatura</p>
          </div>

          <div class="footer">
            <p>Emitido em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Recibo
          </DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="space-y-4 py-4">
          {/* Amount */}
          <div className={`text-center p-4 rounded-lg ${
            transaction.tipo === 'receita' 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            <p className="text-sm text-muted-foreground mb-1">
              {transaction.tipo === 'receita' ? 'Recebimento' : 'Pagamento'}
            </p>
            <p className={`text-3xl font-bold ${
              transaction.tipo === 'receita' ? 'text-green-600' : 'text-destructive'
            }`}>
              {formatCurrency(transaction.valor)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Descrição</span>
              <span className="font-medium">{transaction.descricao}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Vencimento</span>
              <span className="font-medium">
                {format(new Date(transaction.data_vencimento), 'dd/MM/yyyy')}
              </span>
            </div>
            {transaction.data_pagamento && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium">
                  {format(new Date(transaction.data_pagamento), 'dd/MM/yyyy')}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {transaction.status === 'pago' ? 'Pago' : transaction.status === 'pendente' ? 'Pendente' : 'Cancelado'}
              </span>
            </div>
            {project && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Projeto</span>
                <span className="font-medium">{project.nome}</span>
              </div>
            )}
            {client && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{client.nome}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
