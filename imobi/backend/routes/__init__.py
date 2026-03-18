"""Registro de rotas do backend."""

from .auth import router as auth_router
from .imoveis import router as imoveis_router
from .leads import router as leads_router

__all__ = ["auth_router", "imoveis_router", "leads_router"]
