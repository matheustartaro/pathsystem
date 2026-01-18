import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalSearchDialog } from "@/components/search/GlobalSearchDialog";
import Dashboard from "./pages/Dashboard";
import GanttPage from "./pages/GanttPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Financeiro
import FluxoCaixaPage from "./pages/financeiro/FluxoCaixaPage";
import ContasPage from "./pages/financeiro/ContasPage";
import RelatoriosFinanceiroPage from "./pages/financeiro/RelatoriosPage";

// Relatórios
import RelatoriosPage from "./pages/relatorios/RelatoriosPage";

// Catálogo
import ProdutosPage from "./pages/catalogo/ProdutosPage";
import ServicosPage from "./pages/catalogo/ServicosPage";
import PrecosPage from "./pages/catalogo/PrecosPage";

// Clientes
import ClientesPage from "./pages/clientes/ClientesPage";
import NovoClientePage from "./pages/clientes/NovoClientePage";

// Agenda
import AgendaPage from "./pages/agenda/AgendaPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalSearchDialog />
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/gantt" element={<ProtectedRoute><GanttPage /></ProtectedRoute>} />
              <Route path="/projetos" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
              <Route path="/projetos/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              
              {/* Financeiro */}
              <Route path="/financeiro/fluxo-caixa" element={<ProtectedRoute><FluxoCaixaPage /></ProtectedRoute>} />
              <Route path="/financeiro/contas" element={<ProtectedRoute><ContasPage /></ProtectedRoute>} />
              <Route path="/financeiro/relatorios" element={<ProtectedRoute><RelatoriosFinanceiroPage /></ProtectedRoute>} />
              
              {/* Relatórios */}
              <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
              
              {/* Catálogo */}
              <Route path="/catalogo/produtos" element={<ProtectedRoute><ProdutosPage /></ProtectedRoute>} />
              <Route path="/catalogo/servicos" element={<ProtectedRoute><ServicosPage /></ProtectedRoute>} />
              <Route path="/catalogo/precos" element={<ProtectedRoute><PrecosPage /></ProtectedRoute>} />
              
              {/* Clientes */}
              <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
              <Route path="/clientes/novo" element={<ProtectedRoute><NovoClientePage /></ProtectedRoute>} />
              
              {/* Agenda */}
              <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
