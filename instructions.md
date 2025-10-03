
# 🧰 instructions.md

## 👷 Passo a passo do desenvolvimento do Barber# (app completo)

### 1. Setup Inicial do Projeto
- [ ] Criar projeto base React com Vite e Tailwind CSS
- [ ] Configurar ESLint, Prettier, Alias de paths
- [ ] Conectar projeto ao repositório GitHub privado
- [ ] Estrutura inicial de pastas:
  - /apps/
  - /themes/
  - /clientes/
  - /components/
  - /pages/
  - /services/ (Supabase)
  - /contexts/
  - /utils/

### 2. Banco de Dados (Supabase)
- [ ] Criar projeto Supabase
- [ ] Estruturar tabelas:
  - usuarios (id, nome, email, tipo: cliente_final, barbeiro, dono)
  - barbeiros (id_usuario, bio, sede_id)
  - clientes (id_usuario, telefone, data_nascimento)
  - agendamentos (cliente_id, barbeiro_id, servico_id, data_hora, status)
  - servicos (nome, preco, duracao)
  - financeiro (tipo, valor, descricao, usuario_id)
  - planos (nome, recursos_liberados)
  - config_cliente (cliente_id, plano_id, tema, logo_url)
- [ ] Setup de regras de acesso e policies (RLS)
- [ ] Integrar Supabase Auth (login/email + role)

### 3. Sistema de Login
- [ ] Login com email e senha
- [ ] Identificação do tipo de usuário (cliente final, barbeiro, dono)
- [ ] Redirecionamento condicional por tipo
- [ ] Contexto global do usuário logado

### 4. Sistema de Permissões e Plano
- [ ] Leitura de JSON por cliente (ex: clientes/martinscut.json)
- [ ] Estrutura de "feature flags" com base no plano
- [ ] Modo demo/desbloqueio de recursos baseado em tipo de conta

### 5. Agendamento e Agenda
- [ ] Tela de escolha de barbeiro
- [ ] Tela de seleção de serviço e horário
- [ ] Calendário interativo (por barbeiro)
- [ ] Confirmação de agendamento
- [ ] Visualização e edição de agendamentos pelo dono/barbeiro

### 6. Cadastro de Clientes e Barbeiros
- [ ] CRUD completo de clientes
- [ ] CRUD de barbeiros e suas agendas
- [ ] Atribuir serviços e preços por barbeiro

### 7. Notificações por WhatsApp
- [ ] Integração com API (Webhook customizado ou Z-API)
- [ ] Templates por plano (básico ou customizado)
- [ ] Envio automático por evento (agendamento, cancelamento)

### 8. Financeiro (Plus+)
- [ ] Tela de entradas e saídas
- [ ] Lançamento manual e automático de serviços
- [ ] Resumo por barbeiro, serviço e período

### 9. Relatórios e Dashboard
- [ ] Resumo geral mensal (PDF)
- [ ] Visualização de KPIs (clientes, cortes, receita)
- [ ] Filtros por dia/barbeiro

### 10. App Cliente (UI diferenciada)
- [ ] Login específico com permissões reduzidas
- [ ] Acesso à agenda + agendamento
- [ ] Histórico de serviços
- [ ] Reagendar ou cancelar

### 11. Tema Visual e Branding
- [ ] 10 temas pré-definidos (com base visual forte)
- [ ] Logo trocada via config
- [ ] Cores, fontes e imagens carregadas por tema

### 12. Builds e Deploys via Dyad
- [ ] Script build:cliente usando .env dinâmico
- [ ] Pasta public/ com overrides por tema
- [ ] Build de APK personalizada por cliente
- [ ] Upload manual nas lojas via conta Perhash

### 13. Site Institucional (Barber#)
- [ ] Home + Sobre + Blog + Planos + CTA
- [ ] Blog com IA (markdown ou CMS headless)
- [ ] SEO on-page + tags estruturadas
- [ ] Responsivo, bonito, direto ao ponto

### 14. Onboarding do Cliente
- [ ] Formulário interno (para extrair dados de tema)
- [ ] Preencher JSON automático
- [ ] Gerar build + APK
- [ ] Treinamento gravado ou ao vivo
