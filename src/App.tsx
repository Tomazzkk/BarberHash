import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { AnimatePresence } from "framer-motion";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import AppLayout from "@/components/layout/AppLayout";

// Core Pages
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import BarberProfile from "@/pages/BarberProfile";

// Staff Pages
import Dashboard from "@/pages/Dashboard";
import Agenda from "@/pages/Agenda";
import PDV from "@/pages/PDV";
import Clientes from "@/pages/Clientes";
import RelatoriosClientes from "@/pages/RelatoriosClientes";
import RelatoriosDesempenho from "@/pages/RelatoriosDesempenho";
import Avaliacoes from "@/pages/Avaliacoes";
import Servicos from "@/pages/Servicos";
import Barbeiros from "@/pages/Barbeiros";
import Equipe from "@/pages/Equipe";
import Produtos from "@/pages/Produtos";
import Financeiro from "@/pages/Financeiro";
import RelatoriosComissao from "@/pages/RelatoriosComissao";
import Promocoes from "@/pages/Promocoes";
import Marketing from "@/pages/Marketing";
import Sedes from "@/pages/Sedes";
import ActivityLog from "@/pages/ActivityLog";
import Suporte from "@/pages/Suporte";
import Plano from "@/pages/Plano";
import PlanManagement from "@/pages/PlanManagement";
import Configuracoes from "@/pages/Configuracoes";

// Admin Pages
import AdminManageAddons from "@/pages/admin/AdminManageAddons";

// Client App Pages
import CustomerDashboard from "@/pages/app/CustomerDashboard";
import Agendar from "@/pages/app/Agendar";
import Historico from "@/pages/app/Historico";
import Planos from "@/pages/app/Planos";
import Notificacoes from "@/pages/app/Notificacoes";
import ProfilePage from "@/pages/app/Profile";

// Components & Providers
import ProtectedRoute from "@/components/ProtectedRoute";
import SessionInitializer from "@/components/SessionInitializer";
import DynamicThemeApplier from "@/components/DynamicThemeApplier";
import GoogleAnalyticsTracker from "@/components/GoogleAnalyticsTracker";
import SplashScreen from "@/components/SplashScreen";
import { useSessionStore } from "@/hooks/useSessionStore";

const queryClient = new QueryClient();

function App() {
  const { loading, isChangingView } = useSessionStore();

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          <DynamicThemeApplier>
            <SessionInitializer />
            <GoogleAnalyticsTracker />
            <AnimatePresence>
              {(loading || isChangingView) && <SplashScreen />}
            </AnimatePresence>
            <Router>
              <Helmet>
                <title>BarberPro</title>
                <meta name="description" content="A gestão da sua barbearia, elevada a outro nível." />
              </Helmet>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/barbeiro/:barberId" element={<BarberProfile />} />

                {/* Staff Routes */}
                <Route path="/" element={<MainLayout />}>
                  <Route path="dashboard" element={<ProtectedRoute roles={['dono', 'barbeiro', 'gerente', 'supervisor', 'admin']}><Dashboard /></ProtectedRoute>} />
                  <Route path="agenda" element={<ProtectedRoute roles={['dono', 'barbeiro', 'gerente', 'supervisor', 'admin']}><Agenda /></ProtectedRoute>} />
                  <Route path="pdv" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']} feature="pdv"><PDV /></ProtectedRoute>} />
                  <Route path="clientes" element={<ProtectedRoute roles={['dono', 'barbeiro', 'gerente', 'supervisor', 'admin']} permission="pode_gerenciar_clientes"><Clientes /></ProtectedRoute>} />
                  <Route path="relatorios-clientes" element={<ProtectedRoute roles={['dono', 'barbeiro', 'gerente', 'supervisor', 'admin']} permission="pode_gerenciar_clientes"><RelatoriosClientes /></ProtectedRoute>} />
                  <Route path="relatorios-desempenho" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><RelatoriosDesempenho /></ProtectedRoute>} />
                  <Route path="avaliacoes" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><Avaliacoes /></ProtectedRoute>} />
                  <Route path="servicos" element={<ProtectedRoute roles={['dono', 'barbeiro', 'gerente', 'supervisor', 'admin']} permission="pode_editar_servicos"><Servicos /></ProtectedRoute>} />
                  <Route path="barbeiros" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><Barbeiros /></ProtectedRoute>} />
                  <Route path="equipe" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><Equipe /></ProtectedRoute>} />
                  <Route path="produtos" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']} feature="estoque"><Produtos /></ProtectedRoute>} />
                  <Route path="financeiro" element={<ProtectedRoute roles={['dono', 'barbeiro', 'gerente', 'supervisor', 'admin']} permission="pode_ver_financeiro_completo"><Financeiro /></ProtectedRoute>} />
                  <Route path="relatorios-comissao" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><RelatoriosComissao /></ProtectedRoute>} />
                  <Route path="promocoes" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><Promocoes /></ProtectedRoute>} />
                  <Route path="marketing" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><Marketing /></ProtectedRoute>} />
                  <Route path="sedes" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><Sedes /></ProtectedRoute>} />
                  <Route path="activity-log" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><ActivityLog /></ProtectedRoute>} />
                  <Route path="suporte" element={<ProtectedRoute roles={['dono', 'gerente', 'admin']}><Suporte /></ProtectedRoute>} />
                  <Route path="plano" element={<ProtectedRoute roles={['dono', 'gerente', 'supervisor', 'admin']}><Plano /></ProtectedRoute>} />
                  <Route path="plan-management" element={<ProtectedRoute roles={['dono']}><PlanManagement /></ProtectedRoute>} />
                  <Route path="configuracoes" element={<ProtectedRoute roles={['dono', 'barbeiro', 'gerente', 'supervisor', 'admin']}><Configuracoes /></ProtectedRoute>} />
                  <Route path="admin/addons" element={<ProtectedRoute roles={['admin']}><AdminManageAddons /></ProtectedRoute>} />
                </Route>

                {/* Client App Routes */}
                <Route path="/app" element={<AppLayout />}>
                    <Route path="home" element={<ProtectedRoute roles={['cliente_final']}><CustomerDashboard /></ProtectedRoute>} />
                    <Route path="agendar" element={<ProtectedRoute roles={['cliente_final']}><Agendar /></ProtectedRoute>} />
                    <Route path="historico" element={<ProtectedRoute roles={['cliente_final']}><Historico /></ProtectedRoute>} />
                    <Route path="planos" element={<ProtectedRoute roles={['cliente_final']}><Planos /></ProtectedRoute>} />
                    <Route path="notificacoes" element={<ProtectedRoute roles={['cliente_final']}><Notificacoes /></ProtectedRoute>} />
                    <Route path="profile" element={<ProtectedRoute roles={['cliente_final']}><ProfilePage /></ProtectedRoute>} />
                    <Route path="configuracoes" element={<ProtectedRoute roles={['cliente_final']}><Configuracoes /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </DynamicThemeApplier>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;