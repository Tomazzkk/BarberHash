# 📌 Tarefas de Reestruturação Barber#

## 1. 🧑‍💼 Reestruturação de Perfis e Cargos
- [x] Atualizar enum de perfis (`profile.role`)
- [x] Definir permissões detalhadas por perfil
- [x] Adaptar filtros por sede para Gerentes e Supervisores
- [x] Permitir adicionar cargo/função ao criar usuário

---

## 2. 🧩 Problemas Críticos a Corrigir
- [x] Corrigir o funcionamento dos **Planos Premium**
  - [x] Resolver bug no sistema de assinatura
  - [x] Permitir **criação de planos customizados por cliente**
- [x] Corrigir o bug de **temas que não salvam**
- [x] Corrigir a **persistência da configuração de “dados de exemplo”**: checkbox não salva
- [x] Refatorar geração de **dados de exemplo com 50 agendamentos** nos últimos 3 meses
  - Usar `dayjs().subtract(x, 'days')` para simular dinamicamente

---

## 3. 🔐 Segurança
- [x] Ativar **confirmação via WhatsApp para novos usuários**
- [x] Realizar **code review de segurança**
  - [x] Verificar permissões por perfil em todas as rotas
  - [x] Proteger endpoints de agendamento e financeiro contra acessos indevidos
- [x] Adicionar validação de entrada no back-end e front-end (formulários, inputs, etc.)
- [x] Validar uploads (limite de tamanho, tipo de arquivo, extensão)

---

## 4. 🧠 UX, UI e Navegação
- [x] Agrupar itens no menu lateral (Sidebar e Mobile)
- [x] Inserir **ícones e ilustrações em seções vazias**
- [x] Tornar visual do app mais “vivo” com **animações de transição**
- [x] Adicionar **avatares automáticos com opção de upload**
- [x] Garantir consistência de UI entre mobile e web

---

## 5. ⚙️ Configuração Visual por Admin da @perhash.com
- [x] Todas edições visuais (temas, logos, aparência) só podem ser feitas por emails com domínio `@perhash.com`
- [x] Criar uma interface visual para o time da Perhash gerar o “template inicial” do cliente
- [x] Toda configuração da barbearia deve gerar um **JSON de customização**
  - Ex: cores, ícones, frases padrão, imagem de capa, etc.
  - Esse JSON será consumido pelo app e versionado
- [x] Criar `config.json` por cliente para centralizar visual e versão

---

## 6. 📲 Visão do Cliente Final (Frontend App Mobile)
- [x] Implementar novo visual hero premium para tela inicial:
  - [x] Agendamento em destaque
  - [x] Avatar animado
  - [x] Cartão de fidelidade interativo
- [x] Otimizar fluxo de agendamento (barbeiro, data, serviço)
  - [x] Visual mais espaçado e clean
  - [x] Adicionar descrições e miniaturas dos serviços
- [x] Tela de planos com ícones e badges visuais
- [x] Tela de login com plano de fundo e microanimações
- [x] Tela de “Recompensas” com gráfico de progresso e indicações
- [x] Tela de notificações com ícones representativos por tipo
- [x] Novo dashboard cliente com:
  - [x] Cartão de fidelidade
  - [x] Barbeiros recomendados com imagem
  - [x] Atividade recente estilizada
- [x] Portfólio dos barbeiros com fotos grandes e linkável

---

## 7. 🧾 SEO e Otimização para Buscadores
- [x] Remover todo o SEO e adicionar tag `no-index`

---

## 8. ✨ Outras Melhorias
- [x] Criar **logo BARBER# em SVG** com impacto visual
- [x] Atualizar todos os textos institucionais com storytelling
- [x] Adicionar modal de onboarding para novos usuários
- [x] Implementar indicadores visuais de carregamento e sucesso em ações (agendar, pagar, etc.)
- [x] Refatorar documentação interna para leitura técnica e onboarding da equipe

---

## 9. 🔁 Versão dos Apps
- [x] Definir sistema de versionamento de apps por cliente
  - Ex: `app.perhash.com/barbearia-X/config.json`
- [x] Cada app deve consumir sua própria configuração de tema, frase, fidelidade, etc.
- [x] Criar estrutura para deploy modular e escalável por cliente

---

> 🔚 Com esse plano, o Barber# estará posicionado como o app premium líder de gestão para barbearias, com personalização, experiência visual impactante e arquitetura escalável.