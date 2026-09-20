# Deploy gratuito da Cultiva

Arquitetura recomendada para demonstração, TCC ou uso de baixo volume:

- Render Static Site: frontend React;
- Render Free Web Service: API FastAPI;
- Neon Free: PostgreSQL persistente;
- Brevo Free: e-mails de confirmação e recuperação pela API HTTPS.

> O plano gratuito do Render hiberna a API após 15 minutos sem tráfego. A
> primeira chamada após esse período pode levar cerca de um minuto. Portanto,
> esta arquitetura não oferece SLA e não deve ser tratada como produção crítica.

## 1. Criar o banco no Neon

1. Crie um projeto em <https://console.neon.tech>.
2. Na tela **Connect**, selecione a conexão **Pooled** e copie a URL completa.
3. Preserve `sslmode=require` na URL. Ela será usada como `DATABASE_URL`.

Não crie as tabelas manualmente. O container executa `alembic upgrade head` no
deploy e a aplicação cria as tabelas de uma instalação nova.

## 2. Configurar os e-mails na Brevo

1. Crie uma conta gratuita em <https://app.brevo.com>.
2. Em **Settings > Senders & IP**, registre e confirme o endereço remetente.
3. Em **SMTP & API > API Keys**, crie uma chave de API.
4. Guarde a chave e o remetente no formato `Cultiva <email-confirmado@dominio.com>`.

A integração usa a API HTTPS da Brevo porque serviços gratuitos do Render
bloqueiam as portas SMTP tradicionais.

## 3. Publicar o repositório

O arquivo `render.yaml` descreve o frontend e o backend. Depois de enviar esta
versão para o GitHub:

1. Acesse <https://dashboard.render.com/blueprints>.
2. Clique em **New Blueprint Instance** e conecte este repositório.
3. Informe os segredos solicitados:
   - `DATABASE_URL`: URL pooled do Neon;
   - `BREVO_API_KEY`: chave criada na Brevo;
   - `EMAIL_FROM_ADDRESS`: remetente confirmado na Brevo.
4. Confirme a criação dos dois serviços.

URLs previstas:

- Site: `https://cultiva-iot-thiagoribeiro.onrender.com`
- API: `https://cultiva-api-thiagoribeiro.onrender.com`
- OpenAPI: `https://cultiva-api-thiagoribeiro.onrender.com/docs`

Se o Render informar que algum nome já existe, altere os dois nomes e as URLs
correspondentes em `render.yaml` antes do deploy.

## 4. Verificações após o deploy

1. Abra `/health/ready`; o retorno esperado é `{"status":"ready"}`.
2. Cadastre um usuário no site.
3. Confirme se o e-mail da Brevo chegou e valide a conta.
4. Faça login e cadastre uma fazenda.
5. Autorize um dispositivo e teste uma leitura IoT.

Para autorizar um dispositivo no banco remoto, configure temporariamente a
`DATABASE_URL` do Neon no arquivo `.env` local e execute dentro de `backend`:

```bash
.venv/bin/python -m app.cli authorize-device --mac-address "AA:BB:CC:DD:EE:FF"
```

Depois, o sensor pode enviar leituras para:

```text
POST https://cultiva-api-thiagoribeiro.onrender.com/api/sensor/readings/
```

## Limites importantes

- Render: API hiberna depois de 15 minutos e possui franquias mensais.
- Neon: banco escala para zero e tem limites de armazenamento e computação.
- Brevo: até 300 envios de e-mail por dia no plano gratuito.
- Os dados devem ficar no PostgreSQL; o filesystem do Render é efêmero.
