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
- Copie as credenciais e preencha o objeto `firebaseConfig` em [src/services/firebase.ts](src/services/firebase.ts)

3) Configure a chave do chatbot

- Preencha o arquivo [.env](.env) com:

```bash
EXPO_PUBLIC_LLM_API_KEY=SUA_CHAVE
EXPO_PUBLIC_LLM_MODEL=gemini-1.5-flash
EXPO_PUBLIC_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta
EXPO_PUBLIC_LLM_TIMEOUT_MS=12000
```

4) Inicie o app

```bash
npm start
```

5) Abra no celular

- Abra o Expo Go e leia o QR code que aparece no terminal.

## Scripts uteis

```bash
npm start
npm run android
npm run ios
npm run web
```
