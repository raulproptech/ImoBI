"""Schemas Pydantic do backend."""

from .imovel import (
    ImovelBase,
    ImovelCreate,
    ImovelUpdate,
    ImovelOut,
    LeadBase,
    LeadCreate,
    LeadUpdate,
    LeadOut,
    UserBase,
    UserCreate,
    UserUpdate,
    UserOut,
    UserLogin,
    Token,
)

__all__ = [
    "ImovelBase",
    "ImovelCreate",
    "ImovelUpdate",
    "ImovelOut",
    "LeadBase",
    "LeadCreate",
    "LeadUpdate",
    "LeadOut",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserOut",
    "UserLogin",
    "Token",
]
