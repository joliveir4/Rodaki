# Rodaki

Guia simples para rodar o app.

## Requisitos

- Node.js 18+
- Expo Go no celular (ou emulador Android/iOS)

## Passo a passo

1) Instale dependencias

```bash
npm install
```

2) Configure o Firebase

- Crie um projeto no Firebase e habilite:
  - Autenticacao (Email/Senha)
  - Firestore
- Copie as credenciais e preencha o arquivo [.env](.env) com:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=SUA_CHAVE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=SEU_DOMINIO
EXPO_PUBLIC_FIREBASE_PROJECT_ID=SEU_PROJETO
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=SEU_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=SEU_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=SEU_APP_ID
```

3) Configure a chave do chatbot

- Preencha o arquivo [.env](.env) com:

```bash
EXPO_PUBLIC_LLM_API_KEY=SUA_CHAVE
EXPO_PUBLIC_LLM_MODEL=gemini-2.5-flash
EXPO_PUBLIC_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta
EXPO_PUBLIC_LLM_TIMEOUT_MS=12000
```

4) Inicie o app

```bash
npm start
```

5) Abra no celular

- Abra o Expo Go e leia o QR code que aparece no terminal.

## Rodando com Docker

Se quiser executar o Expo dentro de um container, use:

```bash
docker build -t rodaki .
docker run --rm -it \
  --env-file .env \
  -p 8081:8081 \
  -p 19000:19000 \
  -p 19001:19001 \
  -p 19002:19002 \
  -p 3000:3000 \
  rodaki
```

O container sobe com `expo start --tunnel`, o que costuma ser o jeito mais simples de abrir o app no Expo Go quando o processo está isolado em Docker.

Se preferir usar a versão web, troque o comando do container para `npm run web`.

## Rodando com Docker Compose

Para subir o app com `docker compose`, use:

```bash
docker compose up --build
```

O serviço usa o arquivo [.env](.env) e monta o projeto como volume, então mudanças no código aparecem sem recriar a imagem.

## Scripts uteis

```bash
npm start
npm run android
npm run ios
npm run web
```
