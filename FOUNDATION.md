# Triax — Fundação do Produto

## 1. Visão do produto

O Triax é uma plataforma de gestão de capital on-chain que conecta investidores a gestores profissionais por meio de carteiras não-custodiais. O usuário entra por um link de convite, conecta sua wallet e deposita em estratégias automatizadas operadas por um bot sob a supervisão de um gestor. O objetivo é dar acesso simples a estratégias de investimento cripto sem que o investidor precise abrir mão da custódia dos seus fundos.

## 2. Atores do sistema

| Ator | Descrição |
|------|-----------|
| **Usuário (Investidor)** | Pessoa que entra via link, conecta a wallet, deposita capital e acompanha seus resultados. Mantém a custódia dos próprios fundos. |
| **Gestor** | Profissional que se cadastra, configura estratégias de investimento e administra o capital alocado pelos usuários sob sua gestão. |
| **Bot** | Agente automatizado que executa as operações on-chain de acordo com a estratégia definida pelo gestor. |
| **Admin** | Responsável pela plataforma: aprova gestores, monitora o sistema, define parâmetros globais e zela pela segurança e conformidade. |

## 3. Histórias de usuário

> Formato: *Como [ator], quero [ação] para [objetivo].*

- **Entrada via link** — Como usuário, quero acessar a plataforma por um link de convite para começar a investir sem precisar de um cadastro tradicional.
- **Connect wallet** — Como usuário, quero conectar minha carteira (wallet) para autenticar-me e operar mantendo a custódia dos meus fundos.
- **Visualizar gestor** — Como usuário, quero visualizar o perfil, a estratégia e o histórico de desempenho do gestor para decidir se confio nele meu capital.
- **Depositar** — Como usuário, quero depositar capital em uma estratégia para que ele passe a ser gerido automaticamente.
- **Acompanhar** — Como usuário, quero acompanhar o saldo, o rendimento e o histórico das operações para saber como meu investimento está performando.
- **Sacar** — Como usuário, quero sacar meus fundos a qualquer momento para ter liquidez e controle sobre meu capital.

## 4. Histórias do gestor

> Formato: *Como [ator], quero [ação] para [objetivo].*

- **Cadastro** — Como gestor, quero me cadastrar e ser aprovado na plataforma para poder oferecer minhas estratégias aos investidores.
- **Configurar estratégia** — Como gestor, quero configurar os parâmetros da minha estratégia (ativos, regras, limites de risco, taxas) para que o bot opere conforme a minha tese.
- **Visualizar carteira sob gestão** — Como gestor, quero visualizar a carteira total sob minha gestão, os investidores alocados e o desempenho agregado para tomar decisões e prestar contas.

## 5. Funcionalidades core

### P0 — Essencial (MVP)
- Entrada via link de convite
- Connect wallet (autenticação não-custodial)
- Visualização do perfil/estratégia do gestor
- Depósito em estratégia
- Saque de fundos
- Execução de operações pelo bot conforme a estratégia
- Acompanhamento básico de saldo e rendimento

### P1 — Importante
- Cadastro e aprovação de gestores
- Configuração de estratégia pelo gestor
- Painel do gestor com carteira sob gestão
- Histórico detalhado de operações e performance
- Cálculo e cobrança de taxas (performance/gestão)
- Notificações de eventos (depósito, saque, execução)

### P2 — Desejável
- Ranking e comparação de gestores
- Relatórios e exportação de dados
- Múltiplas estratégias por gestor
- Programa de indicação / afiliados
- Painel administrativo avançado (métricas globais, auditoria)

## 6. O que o sistema NÃO faz (limites de escopo)

- **Não tem custódia dos fundos** — o usuário sempre mantém o controle da sua wallet; a plataforma não retém chaves privadas nem fundos.
- **Não oferece garantia de rendimento** — o desempenho depende da estratégia e das condições de mercado; não há promessa de retorno.
- **Não dá aconselhamento financeiro** — a plataforma fornece ferramentas, não recomendação personalizada de investimento.
- **Não realiza on-ramp/off-ramp fiat** — não converte moeda tradicional em cripto; o usuário traz seus próprios ativos on-chain.
- **Não opera fora da blockchain** — todas as operações de capital ocorrem on-chain; não há mercados ou ativos off-chain.
- **Não substitui KYC/compliance de terceiros** — quando exigido, processos regulatórios são tratados por provedores externos, não pelo núcleo do produto.
- **Não permite que o gestor saque ou transfira os fundos do usuário** — o gestor apenas define e executa estratégias; nunca move capital para fora do controle do investidor.
