
# Arquitetura do Sistema - Wallet & Wagering

Este documento descreve as decisões arquiteturais, padrões de design e mecanismos de resiliência implementados no desafio.

---

## Visão Geral da Arquitetura

O sistema adota os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)** organizados na seguinte estrutura de camadas:


src/
├── domain/            # Regras de Negócio Puras (Entities, Value Objects, Services, Events)
├── application/       # Casos de Uso da Aplicação (Use Cases, DTOs de Aplicação)
├── infrastructure/    # Integrações externas (Controllers HTTP, Messaging SQS, Workers, Pino Logger)
└── shared/infra/      # Repositórios MikroORM, Schemas do Banco e Configurações Globais

## 1. Precisão Financeira (Value Object Money)
A manipulação de valores monetários exige isolamento total de imprecisões de ponto flutuante (IEEE 754).

Representação Interna: Utiliza a biblioteca decimal.js para cálculos de ponto fixo.

Imutabilidade: Operações matemáticas (add, subtract) retornam uma nova instância de Money.

Formatação Estrita: A propriedade amount é exposta via getter formatada com .toFixed(2) para garantir rigorosamente 2 casas decimais (ex: '100.50') em JSONs e saídas de texto.

Proteção contra Saldo Negativo: Instâncias não permitem valores negativos nem mais de 2 casas decimais.

## 2. Prevenção contra Double Spending e Concorrência
Para suportar requisições paralelas simultâneas sem inconsistência de saldo:

Locks no Nível de Banco de Dados: Atualizações de saldo na tabela de carteiras utilizam bloqueios transacionais para evitar gravações sobrepostas (Race Conditions).

Double-Entry Ledger: Todas as movimentações geram entradas imutáveis no extrato (WalletLedgerEntry), permitindo reconciliação e auditoria financeira atômica.

Teste de Estresse Integrado: O arquivo wager-concurrency.spec.ts simula 50 requisições simultâneas tentando apostar contra o mesmo saldo, garantindo que apenas as transações válidas passem e o saldo restante permaneça estritamente consistente.

## 3. Idempotência e Transações Assíncronas (Outbox & Inbox Pattern)
A comunicação com serviços externos e processamento assíncrono adota padrões de resiliência distribuída:

Transactional Outbox Pattern: Mensagens de eventos (integration-events) são salvas na tabela outbox_messages na mesma transação do banco de dados do débito/crédito.

Outbox Relay Worker: Um worker em segundo plano lê as mensagens pendentes e as publica no AWS SQS FIFO, eliminando falhas de Dual Write.

Inbox Consumer Pattern: O consumidor de eventos persiste a chave de idempotência na tabela inbox_messages antes de processar, garantindo entrega At-Least-Once com processamento Exactly-Once.

## 4. Observabilidade e Rastreabilidade
Correlation ID Middleware: Toda requisição HTTP recebe ou gera um UUID v4 no header x-correlation-id. Esse identificador é propagado para todos os logs, chamadas internas e eventos de mensageria.

Sanitização de Dados: O logger Pino mascara automaticamente campos sensíveis (password, token, secret, creditCard) com ***REDACTED***.

Health Check & Probes: O HealthModule expõe a integridade do sistema utilizando @nestjs/terminus e verificação ativa do cluster LocalStack SQS.