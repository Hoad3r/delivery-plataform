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

## Tecnologias

- Next.js
- TypeScript
- Firebase (Firestore + Storage)
- Tailwind CSS
- Framer Motion