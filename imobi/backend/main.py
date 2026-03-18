"""Aplicação principal FastAPI do projeto Imobi."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config.database import Base, engine
from backend.models import imovel as _imovel_model  # noqa: F401
from backend.models import lead as _lead_model  # noqa: F401
from backend.models import user as _user_model  # noqa: F401
from backend.routes import auth_router, imoveis_router, leads_router

# Criação automática das tabelas (ambiente inicial de desenvolvimento)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Imobi API",
    description="API de gestão imobiliária com FastAPI, PostgreSQL, JWT e IA Gemini.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajustar em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Retorna erros de validação com mensagem amigável em português."""
    return JSONResponse(
        status_code=422,
        content={
            "erro": "Dados inválidos na requisição.",
            "detalhes": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Tratador global de exceções não previstas."""
    return JSONResponse(
        status_code=500,
        content={"erro": "Erro interno no servidor.", "detalhes": str(exc)},
    )


@app.get("/health", tags=["Sistema"])
def health_check() -> dict[str, str]:
    """Health check da API."""
    return {"status": "ok", "service": "imobi-api"}


app.include_router(auth_router)
app.include_router(imoveis_router)
app.include_router(leads_router)
