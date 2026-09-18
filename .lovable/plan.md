# Diagnóstico do `invalid_payload` — GGCheckout

Nenhuma alteração foi feita.

## O que o endpoint exige

O corpo precisa ser JSON válido, não vazio e menor que 1 MB. Após isso, o schema exige:

- `event`: texto não vazio, até 100 caracteres;
- `createdAt`: texto em formato ISO/RFC 3339 com fuso, como `2024-01-15T10:30:00Z`;
- `payment`: objeto obrigatório;
- `payment.id`: texto não vazio, até 300 caracteres;
- `product`: objeto obrigatório;
- `product.id`: texto não vazio, até 300 caracteres.

Os blocos `customer`, `products` e `webhook` são opcionais, mas, quando enviados, seus campos conhecidos precisam respeitar os tipos definidos. Por exemplo, `customer.email` precisa ser um e-mail válido; `payment.amount` e `products[].price` precisam ser números, não textos nem `null`.

## Comparação com a documentação oficial

O exemplo oficial completo da GGCheckout foi executado contra o schema atual e passou integralmente. Portanto, não existe incompatibilidade entre o schema e o exemplo oficial publicado.

## O que os logs comprovam

- Houve três requisições `POST` publicadas para `/api/public/webhooks/ggcheckout`, todas respondidas com HTTP 400.
- Nenhuma chegou à tabela de auditoria, então a rejeição ocorreu antes do registro do evento.
- Os logs disponíveis não contêm o corpo recebido nem os detalhes produzidos pelo validador.
- A rota converte todas as falhas do schema na mesma resposta genérica `{ "error": "invalid_payload" }` e descarta o caminho exato do erro.

## Causa identificável

Com os dados atualmente registrados, **não é tecnicamente possível identificar exatamente qual campo do teste causou a rejeição**. É possível afirmar apenas que ocorreu uma destas situações:

1. corpo vazio ou acima de 1 MB;
2. JSON inválido;
3. ausência ou formato inválido em `event`, `createdAt`, `payment`, `payment.id`, `product` ou `product.id`;
4. um campo opcional conhecido chegou como `null` ou com tipo diferente do esperado.

Como o exemplo oficial passa, o teste real enviado pela GGCheckout necessariamente difere desse exemplo em pelo menos um desses pontos. Os logs atuais não preservam qual diferença foi.

## Correção mínima necessária

A correção mínima para descobrir a causa real é fazer o endpoint registrar, de forma temporária e segura, somente os caminhos e códigos dos erros de validação — sem registrar segredo, dados pessoais ou o payload completo. Exemplo do diagnóstico esperado: `payment.id: required` ou `createdAt: invalid_format`.

Somente após uma nova tentativa será possível corrigir o schema no campo comprovadamente incompatível. Tornar campos obrigatórios opcionais agora seria uma suposição e poderia enfraquecer a validação.
