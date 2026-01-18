import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalSearchDialog } from "@/components/search/GlobalSearchDialog";
import { SkipLink } from "@/components/ui/skip-link";
import { PageLoading } from "@/components/ui/loading-spinner";

// Eager load critical pages
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

// Lazy load other pages for performance
const GanttPage = lazy(() => import("./pages/GanttPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Financeiro - lazy loaded
const FluxoCaixaPage = lazy(() => import("./pages/financeiro/FluxoCaixaPage"));
const ContasPage = lazy(() => import("./pages/financeiro/ContasPage"));
const RelatoriosFinanceiroPage = lazy(() => import("./pages/financeiro/RelatoriosPage"));

// Relatórios - lazy loaded
const RelatoriosPage = lazy(() => import("./pages/relatorios/RelatoriosPage"));

// Catálogo - lazy loaded
const ProdutosPage = lazy(() => import("./pages/catalogo/ProdutosPage"));
const ServicosPage = lazy(() => import("./pages/catalogo/ServicosPage"));
const PrecosPage = lazy(() => import("./pages/catalogo/PrecosPage"));

// Clientes - lazy loaded
const ClientesPage = lazy(() => import("./pages/clientes/ClientesPage"));
const NovoClientePage = lazy(() => import("./pages/clientes/NovoClientePage"));

// Agenda - lazy loaded
const AgendaPage = lazy(() => import("./pages/agenda/AgendaPage"));

// Orçamentos - lazy loaded
const OrcamentosPage = lazy(() => import("./pages/orcamentos/OrcamentosPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <SkipLink />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalSearchDialog />
            <Suspense fallback={<PageLoading />}>
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
                
                {/* Orçamentos */}
                <Route path="/orcamentos" element={<ProtectedRoute><OrcamentosPage /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
