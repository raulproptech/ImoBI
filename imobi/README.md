# Imobi - Sistema de Gestão Imobiliária com IA

O **Imobi** é uma aplicação full stack para gestão imobiliária com:
- Backend em **FastAPI** + **PostgreSQL** (SQLAlchemy ORM)
- Frontend em **Reflex**
- Autenticação JWT
- CRUD completo de imóveis, leads e usuários
- Integração com **Google Gemini** para geração de conteúdo comercial

---

## 🚀 Tecnologias usadas

### Backend
- FastAPI
- SQLAlchemy 2.x
- PostgreSQL (psycopg2)
- Pydantic
- JWT (python-jose)
- Passlib + bcrypt
- Google Generative AI SDK (Gemini)

### Frontend
- Reflex
- httpx

---

## 📁 Estrutura do projeto

```bash
imobi/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── config/
│   │   └── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── imovel.py
│   │   ├── lead.py
│   │   └── user.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── imoveis.py
│   │   ├── leads.py
│   │   └── auth.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── gemini_service.py
│   └── schemas/
│       ├── __init__.py
│       └── imovel.py
├── frontend/
│   ├── app.py
│   ├── requirements.txt
│   └── components/
│       └── __init__.py
├── .env.example
├── .gitignore
├── README.md
└── start.sh
```

---

## ⚙️ Configuração de ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Ajuste os valores (principalmente `DATABASE_URL`, `SECRET_KEY` e `GEMINI_API_KEY`).

---

## 🧩 Como executar o backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou no Windows:
# .\venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload
```

Backend disponível em:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

---

## 🖥️ Como executar o frontend

```bash
cd frontend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou no Windows:
# .\venv\Scripts\activate

pip install -r requirements.txt
reflex run
```

Frontend disponível em:
- http://localhost:3000

---

## ▶️ Script único para iniciar backend + frontend

Na raiz `imobi/`:

```bash
chmod +x start.sh
./start.sh
```

---

## 🔐 Autenticação

A API utiliza JWT Bearer Token:
- `POST /auth/register` cria usuário
- `POST /auth/login` retorna token
- Endpoints protegidos exigem header:
  - `Authorization: Bearer <token>`

---

## 📚 Endpoints principais

### Sistema
- `GET /health` - Health check

### Auth / Users
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/users`
- `PUT /auth/users/{user_id}`
- `DELETE /auth/users/{user_id}`

### Imóveis
- `POST /imoveis/`
- `GET /imoveis/`
- `GET /imoveis/{imovel_id}`
- `PUT /imoveis/{imovel_id}`
- `DELETE /imoveis/{imovel_id}`

### Leads
- `POST /leads/` (captura pública)
- `GET /leads/`
- `GET /leads/{lead_id}`
- `PUT /leads/{lead_id}`
- `DELETE /leads/{lead_id}`
- `POST /leads/gerar-mensagem/{lead_id}`

---

## ✅ Boas práticas aplicadas

- Estrutura modular por domínio
- Type hints
- Validação robusta com Pydantic
- Tratamento de erros com mensagens em português
- Senhas com hash bcrypt
- Rotas protegidas por JWT
- Serviço de IA desacoplado

---

## 🛠️ Observações importantes

- O backend cria tabelas automaticamente no startup (`Base.metadata.create_all`) para facilitar setup inicial.
- Para produção, recomenda-se usar migrações (Alembic).
- Ajuste CORS em produção para domínios específicos (não usar `*`).

---

## Licença

Uso educacional/comercial interno. Ajuste conforme necessidade do seu negócio.
