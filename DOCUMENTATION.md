# 📄 Documentação Técnica do Sistema Barber#

Este documento serve como uma referência central para o projeto Barber#, detalhando a arquitetura, funcionalidades, modelo de dados e componentes principais.

---

## 1. Visão Geral e Arquitetura

### 1.1. Stack Tecnológica
-   **Frontend**: React com Vite, TypeScript, Tailwind CSS.
-   **Backend & Banco de Dados**: Supabase (Auth, PostgreSQL, Storage, Edge Functions).
-   **UI**: shadcn/ui, Recharts para gráficos, Framer Motion para animações.
-   **Gerenciamento de Estado**: Zustand (`useSessionStore`).
-   **Roteamento**: React Router.
-   **Validação de Formulários**: React Hook Form com Zod.

### 1.2. Estrutura do Projeto
```
/src
├── App.tsx               # Ponto de entrada e configuração de rotas
├── components
│   ├── dashboard/        # Widgets específicos do dashboard
│   ├── forms/            # Formulários reutilizáveis (Zod + RHF)
│   ├── layout/           # Componentes de layout (Sidebar, MainLayout, etc.)
│   └── ui/               # Componentes base do shadcn/ui
├── hooks/
│   └── useSessionStore.ts # Hook Zustand para gerenciar estado global da sessão
├── integrations/
│   └── supabase/         # Cliente Supabase
├── lib/                  # Utilitários e constantes (ex: changelog)
├── pages/
│   └── app/              # Páginas da área do cliente final
└── utils/                # Funções utilitárias (toast, export, etc.)
/supabase
└── functions/            # Código-fonte das Edge Functions
```

### 1.3. Modelo de Dados (Multi-tenancy)
O sistema utiliza um modelo de **multi-tenancy a nível de aplicação**. Cada "tenant" é um dono de barbearia (`dono`). A maioria das tabelas possui uma coluna `user_id` que armazena o ID do dono, garantindo que os dados de uma barbearia sejam isolados das outras através de Políticas de Segurança a Nível de Linha (RLS) no Supabase.

---

## 2. Autenticação e Permissões

### 2.1. Fluxo de Autenticação
O sistema utiliza o **Supabase Auth** para gerenciar usuários. O fluxo é o seguinte:
1.  Um novo usuário se cadastra (como `dono` ou é convidado como `barbeiro`, `gerente`, etc.).
2.  Um gatilho (`on_auth_user_created`) no banco de dados aciona a função `handle_new_user`.
3.  A função `handle_new_user` cria uma entrada correspondente na tabela `public.profiles`, atribuindo a `role` e o `owner_id` (se for um convite).

### 2.2. Perfis de Usuário
-   **Tabela Principal**: `public.profiles`
-   **Perfis (`role`)**:
    -   `dono`: Acesso total às funcionalidades de sua própria barbearia.
    -   `gerente`, `supervisor`, `barbeiro`: Membros da equipe com acesso limitado pelas permissões definidas pelo dono.
    -   `cliente_final`: Acesso apenas à área do cliente para agendamento e visualização do histórico.

### 2.3. Sistema de Permissões
A segurança é garantida em três níveis:
1.  **Rotas (Frontend)**: O componente `/src/components/ProtectedRoute.tsx` protege as rotas com base na `role` do usuário, no plano de assinatura (`feature`) e em permissões específicas (`permission`).
2.  **Políticas RLS (Banco de Dados)**: Cada tabela possui políticas de segurança que restringem o acesso (SELECT, INSERT, UPDATE, DELETE) aos dados. A maioria das políticas verifica se o `user_id` da linha corresponde ao `auth.uid()` do usuário ou ao `owner_id` associado.
3.  **Permissões Granulares (Barbeiros)**: A tabela `public.barbeiro_permissoes` permite que o dono conceda acessos específicos a cada barbeiro (ex: ver financeiro, gerenciar clientes).

---

## 3. Detalhamento das Funcionalidades

| Funcionalidade | Descrição | Tabelas Supabase | Componentes UI Principais | Lógica de Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Visão geral com KPIs, gráficos e atalhos. | `financeiro`, `agendamentos`, `clientes` | `/src/pages/Dashboard.tsx`, `/src/components/dashboard/*` | Agregações SQL via API |
| **Agenda** | Calendário interativo para gerenciar agendamentos. | `agendamentos`, `barbeiros`, `servicos` | `/src/pages/Agenda.tsx`, `AddAppointmentForm.tsx` | `useAvailableSlots.ts` |
| **Clientes (CRM)** | Cadastro e gerenciamento de clientes. | `clientes` | `/src/pages/Clientes.tsx`, `ClientForm.tsx` | RLS |
| **Serviços** | Cadastro de serviços com preço, duração e sinal. | `servicos` | `/src/pages/Servicos.tsx`, `ServiceForm.tsx` | RLS |
| **Equipe** | Gestão de barbeiros e membros da equipe. | `barbeiros`, `profiles`, `barbeiro_permissoes` | `Barbeiros.tsx`, `Equipe.tsx`, `BarberForm.tsx`, `PermissionsForm.tsx` | `invite-user` (Edge Func) |
| **Financeiro** | Controle de fluxo de caixa e relatórios. | `financeiro` | `/src/pages/Financeiro.tsx`, `FinancialEntryForm.tsx` | RLS |
| **PDV & Estoque** | Venda de produtos/serviços e controle de inventário. | `produtos`, `financeiro` | `/src/pages/PDV.tsx`, `/src/pages/Produtos.tsx` | `process_sale` (DB Func) |
| **Marketing** | Campanhas de WhatsApp e promoções. | `promocoes`, `clientes` | `/src/pages/Marketing.tsx`, `Promocoes.tsx` | `send-whatsapp-campaign`, `generate-campaign-suggestion` (Edge Funcs) |
| **App do Cliente** | Área para o cliente final agendar e ver histórico. | `agendamentos`, `cliente_fidelidade`, `referrals` | `/src/pages/app/*`, `AppLayout.tsx` | RLS |

---

## 4. Configuração e Personalização por Cliente

A personalização de cada barbearia é centralizada na tabela `config_cliente`.

-   **Tabela Principal**: `public.config_cliente`
-   **Campos Chave**:
    -   `user_id`: FK para o `dono`.
    -   `plano_id`: FK para a tabela `planos`, define o plano base.
    -   `custom_features`: Campo JSONB que pode sobrescrever as features do plano base.
    -   `theme`: String que define o tema visual (ex: 'dark', 'vintage').
    -   `logo_url`: URL do logo da barbearia.
    -   `loyalty_enabled`, `sinal_enabled`, `training_mode_active`: Flags booleanas para ativar/desativar funcionalidades.

O componente `/src/components/DynamicThemeApplier.tsx` lê o tema do `useSessionStore` e o aplica globalmente.

---

## 5. Edge Functions & Funções de Banco de Dados

O sistema utiliza lógica de backend para tarefas complexas ou que exigem segurança elevada.

### Edge Functions (`/supabase/functions`)
-   `send-whatsapp`: Envia uma única mensagem via Z-API.
-   `send-whatsapp-campaign`: Envia mensagens em massa para um público segmentado.
-   `handle-cancellation`: Cancela um agendamento e notifica a lista de espera.
-   `complete-appointment`: Marca um agendamento como concluído, cria o registro financeiro e atualiza a fidelidade.
-   `invite-user`: Envia um convite de email seguro para um novo membro da equipe.
-   `...e outras.`

### Funções de Banco de Dados (SQL/PLPGSQL)
-   `handle_new_user()`: Cria um perfil de usuário após o cadastro.
-   `process_sale()`: Processa uma venda do PDV de forma atômica.
-   `increment_loyalty_count()`: Atualiza o progresso de fidelidade do cliente.
-   `get_my_owner_id()`: Função de segurança que retorna o ID do dono da barbearia, usada nas políticas RLS.