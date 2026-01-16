import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';

export function SystemSettingsSection() {
  const { settings, updateSetting, isLoading } = useSystemSettings();
  
  const [valorHora, setValorHora] = useState(0);
  const [markupPadrao, setMarkupPadrao] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setValorHora(settings.valor_hora);
      setMarkupPadrao(settings.markup_padrao);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateSetting({ key: 'valor_hora', value: valorHora }),
        updateSetting({ key: 'markup_padrao', value: markupPadrao }),
      ]);
      toast.success('Configurações salvas');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = settings && (
    valorHora !== settings.valor_hora || 
    markupPadrao !== settings.markup_padrao
  );

  // Example calculations
  const exemploServico = {
    horas: 4,
    custoMaoObra: 4 * valorHora,
    precoFinal: 4 * valorHora * markupPadrao,
  };

  const exemploProduto = {
    custo: 50,
    precoFinal: 50 * markupPadrao,
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-muted-foreground animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Configurações do Sistema</h2>
            <p className="text-sm text-muted-foreground">Defina os valores padrão para precificação</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valorHora">Valor Hora (R$)</Label>
            <Input
              id="valorHora"
              type="number"
              step="0.01"
              min="0"
              value={valorHora}
              onChange={(e) => setValorHora(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Valor base por hora de trabalho para cálculo de serviços
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="markupPadrao">Markup Padrão</Label>
            <Input
              id="markupPadrao"
              type="number"
              step="0.1"
              min="1"
              value={markupPadrao}
              onChange={(e) => setMarkupPadrao(parseFloat(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Multiplicador aplicado sobre o custo para definir o preço de venda
            </p>
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Exemplo: Serviço de {exemploServico.horas}h</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo ({exemploServico.horas}h × R${valorHora.toFixed(2)}):</span>
                <span>R$ {exemploServico.custoMaoObra.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Markup (×{markupPadrao}):</span>
                <span className="font-semibold text-primary">R$ {exemploServico.precoFinal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Exemplo: Produto de R${exemploProduto.custo.toFixed(2)}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo:</span>
                <span>R$ {exemploProduto.custo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço (×{markupPadrao}):</span>
                <span className="font-semibold text-primary">R$ {exemploProduto.precoFinal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Fórmulas:<br />
            • Serviço: (Horas × Valor Hora) × Markup<br />
            • Produto: Custo × Markup
          </p>
        </div>
      </div>
    </div>
  );
}
