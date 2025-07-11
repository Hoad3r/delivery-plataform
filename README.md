# Delivery Platform

Uma plataforma de delivery de marmitas com sistema de administração completo.

## Funcionalidades

### Sistema de Estoque de Marmitas

- **Controle de Quantidade**: Cada prato possui um campo de quantidade disponível
- **Atualização Automática**: Quando a quantidade chega a 0, o prato é automaticamente marcado como indisponível
- **Indicadores Visuais**: 
  - 🟢 Verde: Estoque normal (>5 unidades)
  - 🟠 Laranja: Estoque baixo (≤5 unidades) com aviso ⚠️
  - 🔴 Vermelho: Estoque esgotado (0 unidades) com indicador ❌
- **Edição Rápida**: Botão de edição direta na lista para atualizar estoque
- **Validação**: Campos obrigatórios e validação de valores numéricos

### Área Administrativa

- **Adicionar Pratos**: Formulário completo com campo de quantidade disponível
- **Lista de Pratos**: Visualização com coluna de estoque e indicadores visuais
- **Edição de Pratos**: Modal de edição com controle de quantidade
- **Controle de Status**: Ativação/desativação automática baseada no estoque

### Menu do Cliente

- **Filtro Automático**: Pratos com estoque 0 não aparecem no menu
- **Verificação de Disponibilidade**: Considera tanto o status quanto a quantidade disponível

### Dashboard e Relatórios Analíticos

- **Visão Geral**: Dashboard administrativo com visão consolidada dos principais indicadores do negócio.
- **Indicadores-Chave**:
  - Total de pedidos
  - Receita total (com e sem taxa de entrega)
  - Total arrecadado em taxas de entrega
  - Total de clientes (novos e recorrentes)
  - Valor médio do pedido (sem taxa de entrega)
- **Gráficos Interativos**:
  - Pedidos por mês, semana, dia e horário
  - Receita por mês
  - Distribuição de clientes (novos vs recorrentes)
  - Produtos mais vendidos (top 5)
  - Distribuição de vendas por produto
  - Pedidos por região/bairro
  - Tempo médio de entrega por região
- **Comparação de Períodos**:
  - Compare métricas entre períodos (hoje, semana, mês, trimestre, ano)
  - Visualize crescimento ou queda em pedidos e receita
- **Filtros Avançados**:
  - Filtre por produto, horário do pedido e valor mínimo
  - Combine múltiplos filtros para análises detalhadas
- **Exportação de Dados**:
  - Exporte relatórios e gráficos para Excel (CSV) com um clique
- **Pedidos Recentes**:
  - Lista dos últimos pedidos recebidos com status e valores

## Tecnologias

- Next.js
- TypeScript
- Firebase (Firestore + Storage)
- Tailwind CSS
- Framer Motion
