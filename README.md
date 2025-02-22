[![x](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=X&logoColor=white)](https://twitter.com/t_h_e_u)
[![linkedin](https://img.shields.io/badge/Linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/matheusgbatista/)
[![web](https://img.shields.io/badge/web-000000?style=for-the-badge&logo=web&logoColor=white)](https://t-heu.github.io)

## About (WPP Bot)

WPP bot ecommerce.

# Configuração .env

Configure seu arquivo .env

```
Meta_WA_accessToken=
VERIFY_TOKEN_SECRET=testwpp
Meta_WA_SenderPhoneNumberId=
```

# Configuração do NGROK e Servidor

1. Rode o NGROK para expor o seu servidor local:

```
ngrok http 3000
```
Ira exibir algo parecido: https://abc123.ngrok.io -> http://localhost:3000

2. Rode o seu servidor local:

```
npm run start
```

# Configuração do Webhook no Meta Dev

1. No campo **"URL de callback"**, coloque a URL fornecida pelo NGROK:
  - Exemplo: `https://abc123.ngrok.io/webhook`

2. No campo **"Verificar token"**, crie um token de sua escolha:
  - Exemplo: `testwpp`

3. Depois, assine a opção **"messages"** para garantir que as mensagens sejam processadas.


