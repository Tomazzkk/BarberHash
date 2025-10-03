# 🚀 Funcionalidades do Sistema Barber#

Esta é uma lista de todas as funcionalidades implementadas no sistema, cada uma com um breve resumo e os principais componentes de interface associados.

---

### Gestão e Operações

1.  **Autenticação e Perfis de Usuário**: Gerencia o login, cadastro e os diferentes níveis de acesso para donos, equipe e clientes.
    -   **Telas e Componentes**: `/pages/Login.tsx`, `/pages/Equipe.tsx`, `/components/forms/SignUpForm.tsx`, `/components/forms/InviteUserForm.tsx`, `/hooks/useSessionStore.ts`, `/components/ProtectedRoute.tsx`

2.  **Gestão de Múltiplas Sedes**: Permite que o dono da barbearia administre várias filiais a partir de uma única conta.
    -   **Telas e Componentes**: `/pages/Sedes.tsx`, `/components/forms/SedeForm.tsx`, `/components/layout/SedeSelector.tsx`

3.  **Dashboard Analítico**: Oferece uma visão geral do negócio com gráficos e indicadores de faturamento, agendamentos e clientes.
    -   **Telas e Componentes**: `/pages/Dashboard.tsx`, `/components/dashboard/*`

4.  **Agenda Interativa**: Apresenta um calendário diário para visualizar, criar, editar e cancelar agendamentos de forma rápida.
    -   **Telas e Componentes**: `/pages/Agenda.tsx`, `/components/forms/AddAppointmentForm.tsx`, `/hooks/useAvailableSlots.ts`

5.  **Gestão de Clientes (CRM)**: Centraliza o cadastro e o gerenciamento das informações de todos os clientes da barbearia.
    -   **Telas e Componentes**: `/pages/Clientes.tsx`, `/components/forms/ClientForm.tsx`

6.  **Gestão de Serviços**: Permite criar e editar os serviços oferecidos, definindo preço, duração e descrição.
    -   **Telas e Componentes**: `/pages/Servicos.tsx`, `/components/forms/ServiceForm.tsx`

7.  **Gestão de Equipe**: Facilita o cadastro de barbeiros, o convite de novos membros e a atribuição de cargos.
    -   **Telas e Componentes**: `/pages/Barbeiros.tsx`, `/pages/Equipe.tsx`, `/components/forms/BarberForm.tsx`, `/components/forms/WorkingHoursForm.tsx`, `/components/forms/PermissionsForm.tsx`

8.  **Ponto de Venda (PDV)**: Interface para registrar vendas rápidas de serviços e produtos, integrada ao financeiro e estoque.
    -   **Telas e Componentes**: `/pages/PDV.tsx`

9.  **Gestão de Estoque**: Controla o inventário de produtos, com registro de quantidade, preço e custo.
    -   **Telas e Componentes**: `/pages/Produtos.tsx`, `/components/forms/ProductForm.tsx`

10. **Controle Financeiro**: Rastreia todas as entradas e saídas de dinheiro, com lançamentos automáticos e manuais.
    -   **Telas e Componentes**: `/pages/Financeiro.tsx`, `/components/forms/FinancialEntryForm.tsx`

11. **Relatórios (Clientes, Desempenho, Comissão)**: Gera relatórios detalhados para análise do negócio.
    -   **Telas e Componentes**: `/pages/RelatoriosClientes.tsx`, `/pages/RelatoriosDesempenho.tsx`, `/pages/RelatoriosComissao.tsx`

### Marketing e Retenção

12. **Programa de Fidelidade**: Sistema de recompensas digital que incentiva os clientes a retornarem.
    -   **Telas e Componentes**: `/pages/Configuracoes.tsx`, `/pages/app/Recompensas.tsx`, `/components/LoyaltyCard.tsx`

13. **Promoções**: Permite a criação de campanhas com descontos percentuais ou de valor fixo por tempo limitado.
    -   **Telas e Componentes**: `/pages/Promocoes.tsx`, `/components/forms/PromocaoForm.tsx`

14. **Campanhas de WhatsApp**: Envia mensagens promocionais em massa para públicos segmentados de clientes.
    -   **Telas e Componentes**: `/pages/Marketing.tsx`

15. **Sistema de Avaliações**: Coleta feedback dos clientes com notas e comentários após a conclusão dos serviços.
    -   **Telas e Componentes**: `/pages/Avaliacoes.tsx`, `/components/forms/ReviewForm.tsx`

16. **Programa de Indicação**: Recompensa clientes que indicam amigos para a barbearia.
    -   **Telas e Componentes**: `/pages/app/Recompensas.tsx`

17. **Lista de Espera**: Notifica clientes automaticamente quando um horário desejado fica disponível.
    -   **Telas e Componentes**: `/pages/app/Agendar.tsx`, `/components/forms/AppointmentForm.tsx`

### Área do Cliente

18. **Agendamento pelo Cliente**: Fluxo simplificado para que o cliente final possa marcar seu próprio horário.
    -   **Telas e Componentes**: `/pages/app/Agendar.tsx`, `/components/forms/AppointmentForm.tsx`

19. **Histórico do Cliente**: Permite que o cliente visualize seus agendamentos passados e futuros.
    -   **Telas e Componentes**: `/pages/app/Historico.tsx`

20. **Portfólio do Barbeiro**: Página pública onde os clientes podem ver os trabalhos de cada profissional.
    -   **Telas e Componentes**: `/pages/BarberProfile.tsx`, `/components/forms/PortfolioManager.tsx`

21. **Notificações do Cliente**: Central de notificações para o cliente sobre agendamentos, recompensas e avisos.
    -   **Telas e Componentes**: `/pages/app/Notificacoes.tsx`

### Sistema e Suporte

22. **Registro de Atividades**: Grava um histórico de ações importantes realizadas no sistema para auditoria.
    -   **Telas e Componentes**: `/pages/ActivityLog.tsx`

23. **Modo Treinamento**: Preenche o sistema com dados de exemplo para que novos usuários possam explorá-lo sem riscos.
    -   **Telas e Componentes**: `/pages/Configuracoes.tsx`, `/components/TrainingModeManager.tsx`

24. **Ajuda & Suporte**: Página com perguntas frequentes, histórico de versões e contato para suporte.
    -   **Telas e Componentes**: `/pages/Suporte.tsx`