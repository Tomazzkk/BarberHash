# Resumo Técnico e Funcional do Sistema Barber#

Este documento serve como uma referência central para o projeto Barber#, detalhando todas as funcionalidades implementadas, os principais componentes de interface (blocos) e as configurações disponíveis.

---

## 1. Funcionalidades Principais

O sistema é dividido em módulos que atendem aos diferentes perfis de usuário e necessidades do negócio.

### Módulo de Gestão (Dono & Equipe)

-   **Autenticação e Perfis de Usuário**:
    -   Sistema de login e cadastro seguro utilizando **Supabase Auth**.
    -   Suporte a 5 perfis de usuário: `dono`, `gerente`, `supervisor`, `barbeiro`, `cliente_final`.
    -   Criação automática de um perfil na tabela `profiles` para cada novo usuário.
    -   Sistema de convites para adicionar membros à equipe.

-   **Gestão de Múltiplas Sedes**:
    -   O dono pode criar, editar e excluir múltiplas filiais (`sedes`).
    -   A maioria dos dados (agenda, finanças, clientes, etc.) é vinculada a uma sede específica, permitindo gestão segmentada.

-   **Dashboard Analítico**:
    -   Visão geral com KPIs (Key Performance Indicators): Faturamento, Novos Clientes, Agendamentos.
    -   Gráfico de evolução do faturamento com filtro por período.
    -   Cards de acesso rápido: Agendamentos Recentes, Barbeiros em Destaque, Status dos Agendamentos e Receita por Serviço.
    -   Projeção de faturamento para o mês corrente.

-   **Agenda Interativa**:
    -   Visualização de agendamentos em um calendário diário.
    -   Filtro por barbeiro (para donos e gerentes).
    -   Criação, edição e cancelamento de agendamentos.
    -   Cálculo automático de horários disponíveis com base na jornada de trabalho, pausas e outros agendamentos.

-   **Gestão de Clientes (CRM)**:
    -   Cadastro completo de clientes com nome, contato e observações.
    -   Busca e listagem de todos os clientes da sede.

-   **Gestão de Serviços**:
    -   Cadastro de serviços com nome, preço, duração, descrição e opção de exigir sinal.

-   **Gestão de Equipe**:
    -   **Barbeiros**: Cadastro dos profissionais com nome, comissão, biografia, jornada de trabalho e portfólio.
    -   **Permissões Granulares**: O dono pode definir o que cada barbeiro pode acessar (ver financeiro, gerenciar clientes, etc.).
    -   **Membros da Equipe**: Convite de novos usuários com cargos de `gerente` ou `supervisor`.

-   **Gestão de Estoque e PDV (Ponto de Venda)**:
    -   **Estoque**: Cadastro de produtos com controle de quantidade, preço de venda, custo e estoque mínimo.
    -   **PDV**: Interface rápida para registrar vendas de serviços e produtos. A venda de um produto automaticamente deduz a quantidade do estoque.

### Módulo Financeiro

-   **Fluxo de Caixa**:
    -   Registro de todas as `entradas` e `saídas` financeiras.
    -   Lançamentos automáticos a partir de agendamentos concluídos e vendas no PDV.
    -   Permite lançamentos manuais.
    -   Cálculo de saldo total, entradas e saídas para o período selecionado.

-   **Relatórios Detalhados**:
    -   **Comissões**: Gera relatório de comissão por barbeiro, detalhando cada serviço prestado.
    -   **Desempenho da Equipe**: Compara o faturamento e o número de atendimentos entre os barbeiros.
    -   **Clientes**: Mostra os clientes que mais gastaram, clientes inativos e a proporção de clientes novos vs. recorrentes.

### Módulo de Marketing e Retenção

-   **Programa de Fidelidade**:
    -   Sistema de "cartão de selos" digital.
    -   O dono define o número de serviços necessários e o serviço de recompensa.
    -   O progresso é atualizado automaticamente quando um agendamento é concluído.

-   **Promoções**:
    -   Criação de promoções com desconto fixo ou percentual.
    -   Definição de período de validade.
    -   As promoções ativas podem ser aplicadas no PDV.

-   **Campanhas de WhatsApp**:
    -   Envio de mensagens em massa para públicos segmentados (todos, ativos ou inativos).
    -   Sugestão de texto da campanha gerada por IA.

-   **Sistema de Avaliações**:
    -   Clientes podem avaliar os serviços concluídos com nota (estrelas) e comentário.
    -   O dono pode visualizar todas as avaliações recebidas.

### Módulo do Cliente Final

-   **Dashboard do Cliente**:
    -   Visão geral com o próximo agendamento e barbeiros recomendados.
    -   Acesso rápido para agendar e ver o histórico.

-   **Agendamento Simplificado**:
    -   Fluxo guiado para escolher serviço, profissional e horário.
    -   Visualização do portfólio do barbeiro e descrição dos serviços.
    -   Suporte a **Lista de Espera** para dias lotados.

-   **Histórico de Agendamentos**:
    -   Lista de todos os agendamentos passados e futuros.
    -   Opções para cancelar, reagendar, adicionar ao calendário e deixar uma avaliação.

-   **Página de Recompensas**:
    -   Hub centralizado para o cliente acompanhar seu progresso no **Programa de Fidelidade** e no **Programa de Indicação**.

---

## 2. Blocos e Componentes Estruturais

A interface é construída com base em um sistema de componentes reutilizáveis.

-   **Layouts**:
    -   `MainLayout`: Estrutura principal para donos e equipe, com menu lateral e cabeçalho.
    -   `AppLayout`: Estrutura mobile-first para a área do cliente final.

-   **Navegação**:
    -   `Sidebar`: Menu lateral com navegação principal e informações do usuário.
    -   `AppNavigation`: Barra de navegação inferior para o app do cliente.
    -   `Breadcrumbs`: Navegação estrutural no topo da página.

-   **Formulários Principais**:
    -   `AppointmentForm`, `AddAppointmentForm`, `BarberForm`, `ClientForm`, `FinancialEntryForm`, `PermissionsForm`, `PortfolioManager`, `ProductForm`, `PromocaoForm`, `ReviewForm`, `SedeForm`, `ServiceForm`, `SignUpForm`, `WorkingHoursForm`, `InviteUserForm`.

-   **Widgets de Dashboard**:
    -   `StatCard`: Card para exibir um KPI.
    -   `RecentAppointmentsCard`, `TopBarbersCard`, `RevenueProjectionCard`.
    -   `AppointmentStatusChart`, `RevenueByServiceChart`.

-   **Componentes de UX**:
    -   `OnboardingModal`, `WhatsNewModal`: Modais para guiar e informar o usuário.
    -   `LoyaltyCard`: Representação visual do cartão fidelidade.
    -   `SedeSelector`: Dropdown para alternar entre as filiais.

---

## 3. Configurações e Personalizações

A página de **Configurações** permite ao dono da barbearia personalizar diversos aspectos do sistema.

-   **Aparência e Marca**:
    -   **Tema Visual**: Seleção entre 10 temas de cores pré-definidos.
    -   **Logo**: Upload do logo da barbearia, que substitui o logo padrão "Barber#".

-   **Funcionalidades Ativáveis**:
    -   **Programa de Fidelidade**: Ligar/desligar a funcionalidade.
        -   *Configurações*: Nº de serviços para recompensa, serviço de recompensa.
    -   **Sinal de Agendamento**: Ligar/desligar a exigência de pagamento de sinal.
    -   **Modo Treinamento**: Ligar/desligar a geração de dados de exemplo para explorar o sistema sem afetar os dados reais.

-   **Integrações**:
    -   **Google Analytics**: Inserção do ID de métricas do GA4 para rastreamento de uso.