# Backend FastAPI

O backend usa FastAPI, Pydantic 2, SQLAlchemy 2, PostgreSQL e autenticação JWT.
Os nomes das tabelas anteriores do Django foram mantidos, portanto os dados existentes
continuam disponíveis sem uma migração destrutiva.

## Executar

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

A documentação OpenAPI fica em `http://127.0.0.1:8000/docs`.

As migrações Alembic são executadas automaticamente pelo container. Em execução
local, rode `alembic upgrade head` antes de iniciar a API.

Ao desativar um sensor, a instalação em `devices_sensor` e suas leituras são
preservadas. Apenas `is_active` passa para `false` e o dispositivo autorizado é
liberado (`is_used=false`) para uma nova instalação. A fazenda de cada leitura é
obtida pelo relacionamento `reading -> sensor -> farm`.

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
