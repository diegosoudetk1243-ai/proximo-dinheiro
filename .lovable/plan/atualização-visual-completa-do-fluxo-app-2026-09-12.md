# Atualização visual completa do Fluxo App

## Objetivo
Transformar a interface atual em um SaaS financeiro premium baseado na direção **Modern midnight dashboard**, preservando integralmente cálculos, autenticação, cadastro, onboarding, movimentações, recorrências, banco de dados e rotas.

## Identidade visual
- Usar a imagem anexada como símbolo oficial, sem redesenhar ou acrescentar elementos.
- Preparar aplicações do mesmo ativo para marca completa, ícone compacto e favicon.
- Aplicar a paleta escolhida: marinho `#071C2C`, marinho secundário `#0B3550`, turquesa `#16C9A3` e off-white `#F6F9F8`, com verde semântico para entradas e coral para saídas.
- Usar **Sora** em títulos e valores financeiros principais e **Manrope** no restante da interface.
- Criar tokens consistentes para superfícies escuras, bordas discretas, estados, sombras leves, foco e contraste.

## Estrutura e navegação
- Adaptar a composição selecionada para uma área lateral premium no desktop, mantendo exatamente Início, Fluxo, Movimentações e Ajustes.
- Manter navegação inferior própria para celular, com item ativo claro, alvos confortáveis e uso compacto do símbolo oficial.
- Reestilizar cabeçalho, avatar e ação global de adicionar sem alterar seu comportamento.
- Não incluir plano premium, notificações, relatórios ou qualquer item ilustrativo exibido apenas no protótipo.

## Telas
- **Entrada e nova senha:** apresentação forte em marinho, marca oficial, mensagem “Seu dinheiro no controle. Hoje e no futuro.” e formulários claros; manter Google, e-mail, cadastro e recuperação como estão.
- **Início:** reorganizar os mesmos dados em um painel focado: Caixa atual, Caixa previsto, Vai entrar, Vai sair e próximos movimentos. O seletor 7/30/90 dias e o alerta negativo permanecem funcionais.
- **Fluxo:** destacar a passagem de hoje para a data escolhida, saldo projetado, entradas e saídas, mantendo a timeline e o seletor atuais.
- **Movimentações:** melhorar filtros, agrupamentos e linhas; reforçar visualmente entradas em verde e saídas em coral; preservar edição, exclusão e recorrências.
- **Onboarding:** manter as etapas e gravações atuais, acrescentando marca, indicador de progresso e hierarquia visual consistente, sem nova etapa.
- **Ajustes:** organizar perfil, conta principal, saldo inicial, salvar e sair dentro do novo sistema visual.
- **Adicionar/editar movimentação:** uniformizar campos, seletores, estados e botões, mantendo todos os comportamentos existentes.
- **Carregamento e estados vazios:** alinhar skeletons e mensagens à nova composição sem mudar regras de dados.

## Responsividade e acessibilidade
- Tratar desktop e celular como composições próprias, preservando legibilidade de valores longos em BRL.
- Garantir contraste, foco visível, estados desabilitados e áreas de toque adequadas.
- Usar animações discretas e respeitar a preferência por movimento reduzido.

## Detalhes técnicos
- Alterações limitadas à apresentação, componentes visuais e ativos de marca.
- Manter todos os hooks, consultas, mutações, fórmulas, contratos de dados e caminhos atuais.
- Externalizar a imagem oficial para os ativos do projeto e gerar um favicon pequeno a partir dela.
- Atualizar os metadados visuais necessários sem mudar URLs ou navegação.

## Validação
- Verificar as telas de entrada, início, fluxo, movimentações, onboarding, ajustes e modal em desktop e celular.
- Confirmar navegação, filtros, seletor de período, abertura/edição de movimentação e formulários.
- Executar as verificações completas do projeto e conferir ausência de erros no navegador.
