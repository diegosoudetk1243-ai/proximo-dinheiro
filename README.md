# Fluxo App: Your Future Cash

FLUXO APP — SaaS DE FLUXO DE CAIXA PESSOAL

Crie um SaaS web responsivo chamado Fluxo App.

1. IDENTIDADE DO PRODUTO

Nome: Fluxo App

Tagline principal:

Controle seu fluxo de caixa. Saiba quanto você tem hoje e quanto terá amanhã.

Conceito central:

O Fluxo App permite que o usuário registre tudo que entra e sai do seu dinheiro, incluindo movimentações futuras, e calcula automaticamente quanto ele terá em caixa depois dessas movimentações.

O produto deve ser extremamente simples.

Não quero criar um aplicativo financeiro cheio de informações, gráficos e funcionalidades.

O Fluxo App deve fazer uma coisa muito bem:

Mostrar o dinheiro que o usuário tem hoje e projetar quanto ele terá no futuro.

⸻

2. FILOSOFIA DO PRODUTO

O Fluxo App deve seguir esta lógica:

Usuário registra → sistema calcula → usuário visualiza.

O usuário não precisa fazer contas.

Exemplo:

Saldo atual:

R$ 2.000

Entradas futuras:

+ R$ 3.000

Saídas futuras:

− R$ 2.100

O sistema mostra automaticamente:

Caixa previsto

R$ 2.900

O cálculo deve acontecer automaticamente sempre que qualquer movimentação for criada, editada ou excluída.

⸻

3. O QUE NÃO FAZER

NÃO transformar o aplicativo em um “super app financeiro”.

Não adicionar no MVP:

* investimentos;

* ações;

* criptomoedas;

* Open Finance;

* score;

* empréstimos;

* seguros;

* notícias;

* educação financeira;

* gamificação;

* orçamento extremamente complexo;

* dezenas de gráficos;

* dashboards cheios de informações;

* dezenas de categorias obrigatórias;

* funcionalidades bancárias;

* funcionalidades não relacionadas ao fluxo de caixa.

Se houver dúvida entre adicionar uma funcionalidade e manter a experiência simples:

MANTER SIMPLES.

⸻

4. AUTENTICAÇÃO

Utilizar Supabase Auth.

A principal forma de cadastro/login deve ser:

Continuar com Google

O Google OAuth deve aparecer como a opção principal e mais destacada.

Também disponibilizar:

Continuar com e-mail

Permitir:

* cadastro por e-mail e senha;

* login por e-mail e senha;

* recuperação de senha;

* logout.

A tela deve ser visualmente simples.

Exemplo:

⸻

Fluxo App

Controle seu fluxo de caixa.

Saiba quanto você tem hoje e quanto terá amanhã.

[ Continuar com Google ]

ou

[ Continuar com e-mail ]

⸻

Após autenticação:

* se for um novo usuário → onboarding;

* se já tiver concluído o onboarding → Dashboard.

IMPORTANTE:

O onboarding deve aparecer apenas no primeiro acesso.

Depois de concluído:

Login → Dashboard

Nunca mostrar novamente a tela de boas-vindas automaticamente.

⸻

5. ONBOARDING

O primeiro acesso deve possuir uma experiência curta de configuração.

Não abrir um Dashboard vazio.

Tela 1

Bem-vindo ao Fluxo App 👋

Controle seu fluxo de caixa. Saiba quanto você tem hoje e quanto terá amanhã.

Texto:

“Configure seu caixa em poucos passos.”

Botão:

Começar

⸻

Tela 2 — Saldo atual

Quanto você tem hoje?

Campo:

R$ 0,00

Texto auxiliar:

“Informe quanto dinheiro você tem disponível agora.”

Botão:

Continuar

⸻

Tela 3 — Entradas futuras

Vai entrar algum dinheiro?

Permitir adicionar:

Descrição

Exemplo:

Salário

Valor

R$ 3.000

Data

05/10/2026

Permitir adicionar várias entradas.

Também mostrar:

Pular por enquanto

⸻

Tela 4 — Saídas futuras

Vai sair algum dinheiro?

Permitir adicionar:

Descrição

Aluguel

Valor

R$ 1.200

Data

10/10/2026

Permitir adicionar várias saídas.

Também mostrar:

Pular por enquanto

⸻

Tela 5 — Resultado

Mostrar:

Seu caixa está configurado.

Caixa atual

R$ 2.000

Vai entrar

* R$ 3.000

Vai sair

− R$ 2.100

Caixa previsto

R$ 2.900

Botão:

Ver meu caixa

Ao clicar:

→ Dashboard.

⸻

6. DASHBOARD

O Dashboard é a Home permanente do aplicativo.

Nos acessos seguintes, depois do login, o usuário deve entrar diretamente aqui.

A tela deve ser extremamente limpa.

Header

Mostrar:

Fluxo App

À direita:

* perfil;

* configurações.

⸻

Card principal

Título:

Caixa atual

Valor grande:

R$ 2.150,00

Texto:

“Disponível agora”

⸻

Card de previsão

Título:

Caixa previsto

Criar seletor:

7 dias | 30 dias | 90 dias

Exemplo:

R$ 3.050,00

Texto:

“Previsão para os próximos 30 dias”

Abaixo:

+ R$ 3.000,00 vai entrar

− R$ 2.100,00 vai sair

⸻

7. PRÓXIMOS MOVIMENTOS

Na Home mostrar uma lista simples.

Próximos movimentos

05 OUT

Salário

+ R$ 3.000

10 OUT

Aluguel

− R$ 1.200

15 OUT

Internet

− R$ 100

20 OUT

Cartão

− R$ 800

Cada item deve mostrar:

* data;

* descrição;

* valor.

Não mostrar excesso de informações.

⸻

8. BOTÃO DE ADICIONAR

Criar um botão sempre acessível:

+ Adicionar movimentação

No mobile, utilizar botão flutuante ou botão destacado.

Esse deve ser um dos elementos mais importantes da interface.

⸻

9. ADICIONAR MOVIMENTAÇÃO

O usuário deve conseguir cadastrar uma movimentação em poucos segundos.

Ao clicar:

+ Adicionar movimentação

Abrir modal ou tela.

Primeiro:

O que aconteceu?

Dois botões:

ENTROU

SAIU

Depois:

Valor

Campo:

R$ 0,00

Depois:

Descrição

Exemplo:

Mercado

Depois:

Data

Selecionar a data.

A data pode ser:

* passada;

* hoje;

* futura.

Depois:

Vai se repetir?

Opções:

Não

Sim

Se escolher Sim:

* diariamente;

* semanalmente;

* mensalmente;

* anualmente.

Permitir definir:

* sem data final;

* data final;

* número de ocorrências.

Botão:

Adicionar movimentação

Depois de adicionar:

* fechar modal;

* atualizar Dashboard;

* recalcular automaticamente todos os valores.

⸻

10. CONCEITO DE MOVIMENTAÇÃO

Não criar sistemas separados para “gastos atuais” e “gastos futuros”.

Tudo deve ser uma movimentação.

Uma movimentação possui:

* tipo: entrada ou saída;

* valor;

* descrição;

* data;

* recorrência opcional;

* conta;

* categoria opcional;

* status.

A data determina se a movimentação já ocorreu ou ainda ocorrerá.

⸻

11. SALDO ATUAL

O usuário informa inicialmente:

Saldo atual = R$ X

Quando uma movimentação com data de hoje ou passada for registrada como realizada, ela deve afetar o saldo atual.

Exemplo:

Saldo:

R$ 2.000

Entrada:

* R$ 300

Saldo:

R$ 2.300

Saída:

− R$ 150

Saldo:

R$ 2.150

Movimentações futuras NÃO devem alterar o saldo atual.

Elas devem alterar somente a projeção futura.

⸻

12. MOTOR DE PROJEÇÃO

Esta é a função central do Fluxo App.

Não utilizar IA para realizar os cálculos.

Os cálculos devem ser feitos por código de forma determinística.

Saldo atual

Saldo inicial + entradas realizadas − saídas realizadas

Saldo futuro

Saldo atual + entradas futuras − saídas futuras

Exemplo:

Saldo atual:

R$ 2.150

Entradas futuras:

R$ 3.000

Saídas futuras:

R$ 2.100

Resultado:

R$ 3.050

Toda alteração deve atualizar os números automaticamente.

⸻

13. PROJEÇÃO POR DATA

Permitir visualizar a projeção em:

7 dias

30 dias

90 dias

E permitir escolher uma data específica.

Exemplo:

Quanto vou ter daqui a 30 dias?

R$ 3.050

O sistema deve considerar todas as movimentações futuras até a data selecionada.

⸻

14. TELA FLUXO

Criar uma tela chamada:

Fluxo

O objetivo é mostrar o caminho do dinheiro ao longo do tempo.

Exemplo:

OUTUBRO

Hoje

R$ 2.150

↓

05 OUT

Salário

* R$ 3.000

Saldo:

R$ 5.150

↓

10 OUT

Aluguel

− R$ 1.200

Saldo:

R$ 3.950

↓

15 OUT

Internet

− R$ 100

Saldo:

R$ 3.850

↓

20 OUT

Cartão

− R$ 800

Saldo:

R$ 3.050

Essa tela deve ser visualmente simples e fácil de entender.

⸻

15. MOVIMENTAÇÕES RECORRENTES

Permitir registrar:

Salário

* R$ 3.000

Todo dia 5

Mensal

Ou:

Aluguel

− R$ 1.200

Todo dia 10

Mensal

O sistema deve utilizar a recorrência para calcular automaticamente as movimentações futuras.

Não criar infinitos registros no banco.

Utilizar uma estrutura eficiente de recorrência.

Ao editar uma recorrência, permitir:

Alterar somente esta ocorrência

ou

Alterar esta e as próximas

⸻

16. TELA DE MOVIMENTAÇÕES

Criar uma tela simples chamada:

Movimentações

Mostrar todas as movimentações.

Exemplo:

Outubro

05 OUT

Salário

* R$ 3.000

10 OUT

Aluguel

− R$ 1.200

15 OUT

Internet

− R$ 100

20 OUT

Cartão

− R$ 800

Permitir:

* editar;

* excluir;

* filtrar por período;

* filtrar entradas/saídas.

Não criar filtros excessivos.

⸻

17. ALERTA DE CAIXA NEGATIVO

Se uma projeção futura ficar negativa, mostrar um alerta simples.

Exemplo:

⚠️ Atenção

“Seu caixa ficará negativo em 18 de outubro.”

− R$ 320

Mostrar a movimentação que causa o problema.

O objetivo é ajudar o usuário a perceber antecipadamente um problema de caixa.

⸻

18. CATEGORIAS

Categorias são opcionais.

O usuário não precisa selecionar categoria para adicionar uma movimentação.

Categorias iniciais:

* Moradia;

* Alimentação;

* Transporte;

* Saúde;

* Lazer;

* Educação;

* Assinaturas;

* Outros.

O lançamento deve continuar sendo simples:

Entrou/Saiu → Valor → Descrição → Data

⸻

19. IA

Não implementar uma IA complexa no MVP.

O sistema financeiro deve funcionar perfeitamente sem IA.

A IA poderá ser adicionada posteriormente para perguntas como:

“Posso gastar R$ 500?”

“Quanto posso gastar este mês?”

“Quanto vou ter em dezembro?”

“Por que meu caixa vai ficar negativo?”

Mas o cálculo básico do Fluxo App deve sempre ser feito pelo sistema.

⸻

20. BANCO DE DADOS

Utilizar Supabase.

profiles

Campos:

* id;

* name;

* email;

* avatar_url;

* onboarding_completed;

* created_at;

* updated_at.

accounts

Campos:

* id;

* user_id;

* name;

* initial_balance;

* created_at;

* updated_at.

Criar inicialmente uma conta padrão:

Meu Caixa

Estruturar para permitir múltiplas contas no futuro, mas não complicar a interface do MVP.

transactions

Campos:

* id;

* user_id;

* account_id;

* type: income | expense;

* amount;

* description;

* date;

* category_id opcional;

* recurrence_id opcional;

* status;

* created_at;

* updated_at.

recurring_transactions

Campos:

* id;

* user_id;

* account_id;

* type;

* amount;

* description;

* frequency;

* start_date;

* end_date opcional;

* occurrences_limit opcional;

* created_at;

* updated_at.

categories

Campos:

* id;

* user_id opcional;

* name;

* type;

* created_at.

⸻

21. SEGURANÇA

Configurar corretamente:

Row Level Security (RLS)

Cada usuário deve acessar somente seus próprios:

* perfis;

* contas;

* movimentações;

* recorrências;

* categorias.

Nunca permitir que um usuário visualize dados de outro usuário.

⸻

22. NAVEGAÇÃO

Manter a navegação extremamente simples.

No mobile:

Início

Fluxo

Movimentações

Configurações

E um botão destacado:

+

para adicionar movimentação.

No desktop, utilizar uma sidebar ou navegação superior minimalista.

⸻

23. CONFIGURAÇÕES

Mostrar somente:

* nome;

* email;

* foto/avatar;

* conta principal;

* preferências;

* logout.

Não criar configurações desnecessárias.

⸻

24. DESIGN

O design deve parecer um SaaS real e premium.

Estética:

minimalista + fintech moderna + produtividade.

Inspirar sensação em produtos como:

* interfaces modernas de fintech;

* aplicativos financeiros premium;

* aplicativos de produtividade;

* simplicidade visual de produtos Apple.

Características:

* muito espaço;

* tipografia limpa;

* números grandes;

* cards minimalistas;

* bordas suaves;

* ícones discretos;

* poucos elementos;

* microanimações sutis;

* excelente legibilidade.

Não deixar a interface visualmente carregada.

⸻

25. MOBILE FIRST

A prioridade é celular.

O usuário provavelmente chegará ao Fluxo App através de um link de influenciador no celular.

Portanto:

* botões grandes;

* campos fáceis de tocar;

* navegação inferior;

* carregamento rápido;

* excelente responsividade;

* nenhuma tabela difícil de visualizar no celular.

O aplicativo também deve funcionar bem em tablet e desktop.

⸻

26. ESTADOS VAZIOS

Nunca deixar uma tela simplesmente vazia.

Exemplo:

Seu fluxo ainda está vazio.

“Adicione o que vai entrar ou sair para começar a visualizar seu caixa.”

Botão:

+ Adicionar movimentação

⸻

27. LINGUAGEM

Todo o aplicativo deve estar em português brasileiro.

Usar linguagem simples.

Preferir:

Caixa atual

Vai entrar

Vai sair

Caixa previsto

Próximos movimentos

Quanto vou ter?

Evitar linguagem financeira técnica.

⸻

28. FORMATAÇÃO

Moeda:

BRL

Formato:

R$ 1.250,00

Datas:

10/10/2026

Na interface:

10 OUT

Respeitar o padrão brasileiro.

⸻

29. TELAS DO MVP

O MVP deve possuir somente:

1. Login/Cadastro

2. Onboarding

3. Dashboard / Início

4. Fluxo

5. Movimentações

6. Configurações

Não criar uma landing page complexa dentro do aplicativo.

A venda e o acesso comercial serão tratados externamente.

⸻

30. FLUXO COMPLETO

O fluxo esperado é:

Usuário acessa o Fluxo App

↓

Login/Cadastro

↓

Continuar com Google

ou

Continuar com e-mail

↓

É o primeiro acesso?

SIM

↓

Onboarding

↓

Saldo atual

↓

Entradas

↓

Saídas

↓

Resumo

↓

Dashboard

⸻

Se já tiver onboarding concluído:

Login

↓

Dashboard

⸻

31. EXEMPLO COMPLETO

Usuário informa:

Saldo atual

R$ 2.000

Adiciona:

Salário

* R$ 3.000

05/10

Adiciona:

Aluguel

− R$ 1.200

10/10

Adiciona:

Internet

− R$ 100

15/10

Adiciona:

Cartão

− R$ 800

20/10

O Dashboard deve mostrar:

Caixa atual

R$ 2.000

Vai entrar

+ R$ 3.000

Vai sair

− R$ 2.100

Caixa previsto

R$ 2.900

E no Fluxo:

02/10 → R$ 2.000

05/10 → R$ 5.000

10/10 → R$ 3.800

15/10 → R$ 3.700

20/10 → R$ 2.900

Todos esses valores devem ser calculados automaticamente.

⸻

32. INTEGRAÇÃO COM LASTLINK

A comercialização do Fluxo App será feita externamente através da Lastlink.

Não criar checkout dentro do aplicativo neste MVP.

Estruturar a aplicação para posteriormente permitir validação de acesso/assinatura.

O controle de acesso premium deve poder ser adicionado sem precisar reconstruir o sistema.

Por enquanto, priorizar o produto funcional.

⸻

33. QUALIDADE TÉCNICA

Não criar apenas uma interface visual.

Criar um SaaS funcional com:

* autenticação real;

* Google OAuth;

* Supabase;

* banco de dados persistente;

* CRUD de movimentações;

* cálculos reais;

* projeção futura;

* recorrências;

* RLS;

* validação de dados;

* tratamento de erros;

* estados de loading;

* responsividade;

* persistência após logout/login.

Não utilizar dados mockados na aplicação final para usuários autenticados.

⸻

34. PRIORIDADE DE IMPLEMENTAÇÃO

Construir nesta ordem:

Fase 1

Supabase + autenticação Google/e-mail.

Fase 2

Perfis e onboarding.

Fase 3

Saldo atual.

Fase 4

Entradas e saídas.

Fase 5

Motor de cálculo.

Fase 6

Movimentações futuras.

Fase 7

Projeção de caixa.

Fase 8

Recorrências.

Fase 9

Tela Fluxo.

Fase 10

Polimento mobile e UX.

Não adicionar funcionalidades secundárias antes de o fluxo principal estar funcionando perfeitamente.

⸻

35. REGRA DE OURO

Toda decisão de produto deve respeitar esta frase:

O usuário registra. O Fluxo App calcula. O usuário enxerga o futuro.

O aplicativo não deve fazer o usuário trabalhar para controlar as próprias finanças.

Ele deve fazer o trabalho pesado.

A experiência final precisa fazer o usuário pensar:

“Agora eu sei quanto tenho e consigo saber quanto vou ter.”

Esse é o objetivo principal do Fluxo App.

Construa o produto com foco absoluto nessa experiência.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a9e94b8-d2b6-49b2-b15b-80690dd9f384).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
