# 📋 BarberHash — Tarefas Técnicas Detalhadas com Melhores Práticas

Este documento define tarefas críticas para melhorar estabilidade, segurança, UX, performance visual e SEO do projeto BarberHash.

---

## 1. 🎨 CORREÇÃO DOS TEMAS QUE PARARAM DE FUNCIONAR
- Verificar se o tema está corretamente salvo e recuperado via Supabase ou localStorage
- Validar se o CSS personalizado (Tailwind + tokens) está sendo corretamente aplicado ao `<body>` ou `<html>`
- Padronizar o mecanismo de seleção: usar `useContext` ou `zustand` para manter o tema globalmente
- Criar fallback automático para o tema padrão caso erro ocorra
- Testar troca de tema em diferentes rotas e usuários

---

## 2. 📊 INSERIR DADOS DE TREINAMENTO (SAMPLE DATA) DINÂMICOS
- Gerar pelo menos 50 registros de agendamento distribuídos nos últimos 3 meses
- Utilizar `dayjs` ou `date-fns` para datas dinâmicas
- Variar serviços, status, barbeiros e clientes
- Incluir pagamentos fictícios variados
- Garantir que isso não afeta dados reais de produção

---

## 3. 🐞 FIX: SAMPLE DATA RESETANDO
- Corrigir persistência da opção em Supabase config
- Verificar e aplicar corretamente em `onMount`
- Mostrar toast de confirmação ao usuário

---

## 4. 🔐 SEGURANÇA GERAL DO APP
- Ativar RLS em todas as tabelas do Supabase
- Verificar middleware e rotas protegidas
- Validar tokens e entradas do usuário
- Forçar HTTPS
- Usar ZAP Proxy para testes de vulnerabilidade

---

## 5. 🧠 ANÁLISE FUNCIONAL COMPLETA (UX/UI)
- Simular todos os perfis de uso
- Corrigir mensagens confusas, passos redundantes
- Melhorar feedback de ações (toasts, loaders, validações)
- Garantir consistência na nomenclatura

---

## 6. 📁 REESTRUTURAÇÃO DO MENU
- Separar navegação principal e secundária
- Usar accordion ou dropdown
- Exibir só o necessário por perfil de usuário
- Reduzir ícones na barra lateral

---

## 7. 🧩 VERIFICAÇÃO DE UX GERAL
- Garantir fluidez, foco, acessibilidade
- Inserir microanimações
- Corrigir uso de capslock excessivo
- Organizar melhor formulários longos

---

## 8. 🖼️ MELHORIA VISUAL: INSERIR IMAGENS
- Adicionar imagens reais ou mockups
- Mostrar app em uso real (banners, cards)
- Trocar áreas estáticas por visuais ativos
- Explorar SVGs, fotos e texturas

---

## 9. 🌐 SEO REVISADO
- Corrigir `<title>`, meta tags, slugs
- Implementar OG tags e sitemap
- Criar blog estruturado por tópicos
- Usar `next/head` ou `react-helmet`

---

## 10. 🔠 INSERIR LOGO BARBER# EM IMPACT
- Criar SVG com Founders Grotesk X Condensed
- Exportar versão branca e preta
- Incluir como componente no header