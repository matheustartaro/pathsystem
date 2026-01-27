import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutGrid, 
  Banknote, 
  Layers, 
  BoxIcon, 
  UsersRound
} from 'lucide-react';
import { VisaoGeralTab } from '@/components/relatorios/VisaoGeralTab';
import { FinanceiroTab } from '@/components/relatorios/FinanceiroTab';
import { ProjetosTab } from '@/components/relatorios/ProjetosTab';
import { CatalogoTab } from '@/components/relatorios/CatalogoTab';
import { ClientesTab } from '@/components/relatorios/ClientesTab';

const tabs = [
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutGrid },
  { id: 'financeiro', label: 'Financeiro', icon: Banknote },
  { id: 'projetos', label: 'Projetos', icon: Layers },
  { id: 'catalogo', label: 'Catálogo', icon: BoxIcon },
  { id: 'clientes', label: 'Clientes', icon: UsersRound },
];

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('visao-geral');

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Relatórios</h1>
          <p className="text-xs text-muted-foreground">Análise completa do seu negócio</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1 bg-muted">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 min-w-[120px] gap-2 data-[state=active]:bg-background"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="visao-geral" className="mt-6">
            <VisaoGeralTab />
          </TabsContent>

          <TabsContent value="financeiro" className="mt-6">
            <FinanceiroTab />
          </TabsContent>

          <TabsContent value="projetos" className="mt-6">
            <ProjetosTab />
          </TabsContent>

          <TabsContent value="catalogo" className="mt-6">
            <CatalogoTab />
          </TabsContent>

          <TabsContent value="clientes" className="mt-6">
            <ClientesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
