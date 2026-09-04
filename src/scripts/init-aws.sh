#!/bin/bash
echo "=== Inicializando Filas SQS no LocalStack ==="

# 1. Cria a Fila Dead Letter Queue (DLQ) FIFO
awslocal sqs create-queue \
  --queue-name wager-transactions-dlq.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# 2. Captura o ARN da DLQ para configurar a RedrivePolicy
DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/wager-transactions-dlq.fifo \
  --attribute-names QueueArn \
  --query Attributes.QueueArn --output text)

echo "DLQ ARN: $DLQ_ARN"

# 3. Cria a Fila Principal FIFO vinculada à DLQ (máximo de 3 tentativas antes de falhar para a DLQ)
awslocal sqs create-queue \
  --queue-name wager-transactions.fifo \
  --attributes \
    FifoQueue=true,\
    ContentBasedDeduplication=true,\
    RedrivePolicy="{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"3\"}"

echo "=== Filas SQS criadas com sucesso ==="