# Backend FastAPI

O backend usa FastAPI, Pydantic 2, SQLAlchemy 2, PostgreSQL e autenticação JWT.
Os nomes das tabelas anteriores do Django foram mantidos, portanto os dados existentes
continuam disponíveis sem uma migração destrutiva.

## Executar

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A documentação OpenAPI fica em `http://127.0.0.1:8000/docs`.

O cadastro público está disponível em `POST /api/auth/register/`. Após criar a
conta, a API devolve o JWT e os dados do usuário, permitindo que o frontend
inicie a sessão automaticamente.

Variáveis aceitas: `DATABASE_URL` ou `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`
e `DB_PORT`. Defina também um `JWT_SECRET_KEY` longo e aleatório. Por compatibilidade,
`SECRET_KEY` também é aceito.

Para criar o primeiro usuário em um banco novo:

```bash
python -m app.cli create-user --email usuario@example.com --name "Usuário"
```

Para incluir um sensor no estoque de dispositivos autorizados:

```bash
python -m app.cli authorize-device --mac-address "AA:BB:CC:DD:EE:FF"
```

## Testes

```bash
pytest
```
