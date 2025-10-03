# Status e Arquitetura do SaaS Barber#

Este documento serve como uma referência técnica central para o projeto, detalhando cada funcionalidade, seu status de desenvolvimento, as tabelas de banco de dados envolvidas, e os componentes de interface de usuário correspondentes.

---

## 1. Autenticação e Perfis de Usuário

-   **Status**: ✅ Concluído
-   **Descrição**: Gerencia o cadastro, login e os diferentes tipos de usuários (`dono`, `gerente`, `supervisor`, `barbeiro`, `cliente_final`) utilizando o Supabase Auth. Uma função (`handle_new_user`) no banco de dados é acionada por um gatilho para criar um perfil correspondente na tabela `public.profiles` para cada novo usuário.
-   **Tabelas Principais**: `auth.users`, `public.profiles`
-   **Campos e Relacionamentos**:
    -   `profiles.id`: Chave primária e estrangeira que referencia `auth.users.id`.
    -   `profiles.role`: Define o tipo de usuário e controla o acesso às funcionalidades.
    -   `profiles.owner_id`: FK para `auth.users.id` (identifica o dono/convidante).
-   **UI Principal**:
    -   `/src/pages/Login.tsx`: Interface de login e cadastro.
    -   `/src/hooks/useSessionStore.ts`: Gerencia o estado da sessão e os dados do perfil do usuário logado.
    -   `/src/components/ProtectedRoute.tsx`: Componente que protege as rotas com base na role do usuário.
    -   `/src/pages/Equipe.tsx`: Interface para convidar novos membros da equipe.

---

## 2. Gestão de Múltiplas Sedes/Filiais

-   **Status**: ✅ Concluído
-   **Descrição**: Permite que donos de barbearia criem, editem e excluam múltiplas unidades de negócio. A maioria das outras funcionalidades (agenda, clientes, finanças, etc.) é filtrada pela sede selecionada no menu lateral, proporcionando uma gestão segmentada.
-   **Tabelas Principais**: `public.sedes`
-   **Campos e Relacionamentos**:
    -   `sedes.user_id`: FK para `auth.users.id` (identifica o dono).
    -   `sede_id` (FK para `sedes.id`): Presente em tabelas como `agendamentos`, `barbeiros`, `clientes`, `servicos`, `produtos`, `financeiro` para associar os registros a uma filial específica.
-   **UI Principal**:
    -   `/src/pages/Sedes.tsx`: Página para CRUD de sedes.
    -   `/src/components/forms/SedeForm.tsx`: Formulário de criação/edição.
    -   `/src/components/layout/SedeSelector.tsx`: Componente no menu lateral para trocar de filial.

---

## 3. Dashboard (Dono/Equipe)

-   **Status**: ✅ Concluído
-   **Descrição**: Painel analítico que exibe KPIs (Key Performance Indicators) como faturamento, total de agendamentos e novos clientes. Apresenta gráficos de faturamento ao longo do tempo, agendamentos recentes, barbeiros mais produtivos e status dos agendamentos. Os dados são dinamicamente filtrados pelo período de datas e pela sede selecionada.
-   **Tabelas Principais**: `financeiro`, `agendamentos`, `clientes`, `barbeiros`, `servicos`
-   **Campos e Relacionamentos**: Realiza agregações em `financeiro.valor`, contagens em `agendamentos`, e junções para obter nomes de clientes, barbeiros e serviços.
-   **UI Principal**:
    -   `/src/pages/Dashboard.tsx`: Página principal do dashboard.
    -   `/src/components/dashboard/*`: Componentes específicos para cada card e gráfico.

---

## 4. Agenda e Agendamentos

-   **Status**: ✅ Concluído
-   **Descrição**: Sistema de calendário interativo para visualização e gerenciamento de horários. Permite criar, editar e cancelar agendamentos. Para donos, a visualização pode ser filtrada por barbeiro. O sistema também lida com a lógica de horários disponíveis, considerando a jornada de trabalho, pausas e outros agendamentos.
-   **Tabelas Principais**: `agendamentos`, `barbeiros`, `servicos`, `clientes`
-   **Campos e Relacionamentos**:
    -   `agendamentos` é a tabela central, com FKs para `barbeiros`, `servicos` e `clientes`.
    -   `agendamentos.status`: Controla o estado do agendamento ('confirmado', 'concluido', 'cancelado').
-   **UI Principal**:
    -   `/src/pages/Agenda.tsx`: Interface principal da agenda.
    -   `/src/components/forms/AddAppointmentForm.tsx`: Formulário para novos agendamentos.
    -   `/src/hooks/useAvailableSlots.ts`: Hook que calcula os horários disponíveis.

---

## 5. Gestão de Clientes (CRM)

-   **Status**: ✅ Concluído
-   **Descrição**: Funcionalidade de Cadastro de Clientes que permite à barbearia manter um registro de seus clientes, incluindo nome, contato e observações.
-   **Tabelas Principais**: `public.clientes`
-   **Campos e Relacionamentos**:
    -   `clientes.user_id`: FK para `auth.users.id` (identifica o dono da barbearia).
    -   `clientes.sede_id`: FK para `sedes.id`.
-   **UI Principal**:
    -   `/src/pages/Clientes.tsx`: Página para listar, buscar e gerenciar clientes.
    -   `/src/components/forms/ClientForm.tsx`: Formulário de criação/edição.

---

## 6. Gestão de Serviços

-   **Status**: ✅ Concluído
-   **Descrição**: Permite que a barbearia cadastre todos os serviços oferecidos, definindo nome, preço, duração em minutos, descrição e se um sinal de pagamento é necessário.
-   **Tabelas Principais**: `public.servicos`
-   **Campos e Relacionamentos**:
    -   `servicos.user_id`: FK para o dono.
    -   `servicos.sede_id`: FK para a filial.
    -   `servicos.description`: Campo de texto para detalhar o serviço.
    -   `servicos.sinal_required` e `servicos.sinal_value`: Campos para a funcionalidade de pagamento.
-   **UI Principal**:
    -   `/src/pages/Servicos.tsx`: Página para CRUD de serviços.
    -   `/src/components/forms/ServiceForm.tsx`: Formulário de criação/edição.

---

## 7. Gestão de Equipe

-   **Status**: ✅ Concluído
-   **Descrição**: Cadastro dos profissionais da barbearia e outros membros da equipe. Permite definir nome, comissão, biografia e, crucialmente, a jornada de trabalho detalhada para cada barbeiro.
-   **Tabelas Principais**: `public.barbeiros`, `public.profiles`
-   **Campos e Relacionamentos**:
    -   `barbeiros.user_id`: FK para o dono.
    -   `barbeiros.sede_id`: FK para a filial.
    -   `barbeiros.working_hours`: Campo do tipo JSONB que armazena a estrutura de horários de trabalho.
-   **UI Principal**:
    -   `/src/pages/Barbeiros.tsx`: Página para gerenciar barbeiros.
    -   `/src/pages/Equipe.tsx`: Página para convidar e gerenciar outros membros da equipe.
    -   `/src/components/forms/BarberForm.tsx`: Formulário para dados básicos do barbeiro.
    -   `/src/components/forms/WorkingHoursForm.tsx`: Formulário para horários de trabalho.
    -   `/src/components/forms/InviteUserForm.tsx`: Formulário para convidar novos usuários.

---

## 8. Controle de Permissões de Barbeiros

-   **Status**: ✅ Concluído
-   **Descrição**: Sistema granular que permite ao dono da barbearia definir quais seções do sistema cada barbeiro pode acessar (ex: ver financeiro completo, gerenciar clientes, editar serviços).
-   **Tabelas Principais**: `public.barbeiro_permissoes`
-   **Campos e Relacionamentos**:
    -   `barbeiro_permissoes.barbeiro_id`: FK para `barbeiros.id`.
    -   Campos booleanos como `pode_ver_financeiro_completo`.
-   **UI Principal**:
    -   `/src/components/forms/PermissionsForm.tsx`: Formulário acessado através de um modal na página de Barbeiros.
    -   `/src/hooks/useSessionStore.ts`: Onde as permissões são carregadas para o estado global.

---

## 9. Portfólio do Barbeiro

-   **Status**: ✅ Concluído
-   **Descrição**: Permite que cada barbeiro tenha uma galeria de fotos de seus trabalhos. As imagens são armazenadas no Supabase Storage. Há também uma página pública para que os clientes possam visualizar o portfólio com um efeito de lightbox.
-   **Tabelas Principais**: `public.barbeiro_portfolio_items`, `storage.objects` (bucket 'portfolio')
-   **Campos e Relacionamentos**:
    -   `barbeiro_portfolio_items.barbeiro_id`: FK para `barbeiros.id`.
    -   `barbeiro_portfolio_items.image_url`: URL pública da imagem no Storage.
-   **UI Principal**:
    -   `/src/components/forms/PortfolioManager.tsx`: Interface para upload e exclusão de imagens.
    -   `/src/pages/BarberProfile.tsx`: Página pública de visualização.

---

## 10. Controle Financeiro

-   **Status**: ✅ Concluído
-   **Descrição**: Ferramenta para registrar todas as transações financeiras (entradas e saídas). As entradas são criadas automaticamente ao concluir um agendamento ou venda no PDV. Lançamentos manuais também são permitidos.
-   **Tabelas Principais**: `public.financeiro`
-   **Campos e Relacionamentos**:
    -   `financeiro.agendamento_id`: FK opcional para `agendamentos.id`.
    -   `financeiro.tipo`: 'entrada' ou 'saida'.
-   **UI Principal**:
    -   `/src/pages/Financeiro.tsx`: Página para visualizar e gerenciar o fluxo de caixa.
    -   `/src/components/forms/FinancialEntryForm.tsx`: Formulário para lançamentos manuais.

---

## 11. Ponto de Venda (PDV) e Estoque

-   **Status**: ✅ Concluído
-   **Descrição**: Sistema integrado. O **Estoque** permite o CRUD de produtos, com controle de quantidade atual e mínima. O **PDV** é uma interface rápida para registrar a venda de serviço e produtos. Ao finalizar uma venda de produto no PDV, a quantidade em estoque é decrementada automaticamente.
-   **Tabelas Principais**: `public.produtos`, `public.financeiro`
-   **Funções de Banco de Dados**: `process_sale` (função RPC que processa a venda, atualiza o estoque e cria o registro financeiro de forma atômica).
-   **UI Principal**:
    -   `/src/pages/Produtos.tsx`: Gerenciamento de produtos.
    -   `/src/pages/PDV.tsx`: Interface de venda.

---

## 12. App do Cliente Final

-   **Status**: ✅ Concluído
-   **Descrição**: Uma área separada e simplificada para o cliente final. Após o login, ele é direcionado para um layout mobile-first onde pode agendar novos horários, visualizar seu histórico, cancelar agendamentos futuros e gerenciar suas recompensas.
-   **Tabelas Principais**: `agendamentos`, `servicos`, `barbeiros`, `cliente_fidelidade`, `referrals`
-   **UI Principal**:
    -   `/src/components/layout/AppLayout.tsx`: Layout principal da área do cliente.
    -   `/src/pages/app/CustomerDashboard.tsx`: Tela inicial do cliente.
    -   `/src/pages/app/Agendar.tsx`: Formulário de agendamento simplificado.
    -   `/src/pages/app/Historico.tsx`: Lista de agendamentos passados e futuros.
    -   `/src/pages/app/Recompensas.tsx`: Hub centralizado para programa de fidelidade e indicações.

---

## 13. Funcionalidades Adicionais e de Suporte

-   **Programa de Fidelidade**: ✅ Concluído. Gerenciado em `/src/pages/Configuracoes.tsx`. Utiliza a tabela `cliente_fidelidade` e a função `increment_loyalty_count`.
-   **Sinal de Agendamento (Pagamentos)**: ✅ Concluído. Integrado com Stripe. Utiliza a Edge Function `create-stripe-checkout`.
-   **Notificações via WhatsApp**: ✅ Concluído. Utiliza a Edge Function `send-whatsapp` que se integra com a Z-API.
-   **Sistema de Avaliações**: ✅ Concluído. Clientes podem avaliar serviços concluídos. Utiliza a tabela `avaliacoes`. Gerenciado em `/src/pages/Avaliacoes.tsx`.
-   **Campanhas de Marketing**: ✅ Concluído. Envio em massa via WhatsApp para públicos segmentados. Utiliza a Edge Function `send-whatsapp-campaign`.
-   **Lista de Espera**: ✅ Concluído. Clientes podem ser notificados sobre vagas. Utiliza a tabela `lista_espera` e a Edge Function `handle-cancellation`.
-   **Registro de Atividades**: ✅ Concluído. Grava ações importantes no sistema. Utiliza a tabela `audit_log`. Visualizado em `/src/pages/ActivityLog.tsx`.
-   **Ajuda & Suporte**: ✅ Concluído. Página estática com FAQ e informações de contato. Localizada em `/src/pages/Suporte.tsx`.