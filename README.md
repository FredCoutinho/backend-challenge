
# Jungle Gaming - Backend Challenge

Sistema de alta performance para gestão de carteiras financeiras, apostas e transações com garantia de integridade, prevenção contra *double spending*, suporte a concorrência e arquitetura orientada a eventos.

---

## Tecnogias e Ferramentas

* **Runtime & Package Manager:** [Bun](https://bun.sh/)
* **Framework:** [NestJS v12](https://nestjs.com/)
* **Linguagem:** TypeScript v6
* **Banco de Dados:** PostgreSQL 16 com [MikroORM v6](https://mikro-orm.io/)
* **Mensageria & Filas:** AWS SQS simulado via [LocalStack 3.5](https://localstack.cloud/)
* **Testes:** [Vitest](https://vitest.dev/) (Unidade, Integração e E2E)
* **Precisão Financeira:** [Decimal.js](https://mikemcl.github.io/decimal.js/)
* **Observabilidade:** NestJS Pino (Logs estruturados em JSON) + NestJS Terminus (Health Checks)

---

## Como Executar o Projeto

### Pré-requisitos
* Docker e Docker Compose instalados.
* Runtime [Bun](https://bun.sh/) instalado localmente.

### 1. Subir a Infraestrutura (PostgreSQL + LocalStack SQS)


docker-compose up -d

2. Instalar Dependências

bun install
3. Executar as Migrações do Banco de Dados

npm run migration:up
4. Iniciar a Aplicação em Modo Desenvolvimento

npm run start:dev

A API estará disponível por padrão em http://localhost:3000.

## Execução de Testes

O projeto utiliza Vitest para execução ultra-rápida de testes de unidade, regras de negócio e resiliência à concorrência.

# Rodar todos os testes de unidade e concorrência
npm run test

# Rodar testes com acompanhamento em tempo real (watch)
npm run test:watch

# Rodar testes de integração E2E
npm run test:e2e

# Gerar relatório de cobertura de código
npm run test:cov

## Observabilidade & Health Checks

Logs Estruturados: Todos os logs são emitidos no formato JSON com correlationId propagado em todas as requisições HTTP (x-correlation-id) e sanitização automática de dados sensíveis.

Health Check Endpoint: GET /health — Retorna o estado do banco de dados e conexão das filas SQS.

## Scripts Disponíveis (package.json)

npm run start:dev — Inicia a aplicação via Bun com hot-reload.

npm run build — Compila o projeto NestJS para produção.

npm run lint — Validação estática de código com Oxlint.

npm run migration:create — Cria uma nova migração do MikroORM.

npm run migration:up — Executa as migrações pendentes no banco.