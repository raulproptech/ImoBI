"""Schemas Pydantic para autenticação, imóveis, leads e usuários."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ======================
# AUTH
# ======================
class UserLogin(BaseModel):
    """Schema para login de usuário."""

    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class Token(BaseModel):
    """Schema de resposta para token JWT."""

    access_token: str
    token_type: str = "bearer"


# ======================
# USER
# ======================
class UserBase(BaseModel):
    """Campos comuns de usuário."""

    email: EmailStr
    nome: str = Field(min_length=2, max_length=120)
    perfil: str = Field(default="corretor", max_length=30)
    ativo: bool = True


class UserCreate(UserBase):
    """Schema para criação de usuário."""

    password: str = Field(min_length=6, max_length=128)


class UserUpdate(BaseModel):
    """Schema para atualização de usuário."""

    nome: Optional[str] = Field(default=None, min_length=2, max_length=120)
    perfil: Optional[str] = Field(default=None, max_length=30)
    ativo: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class UserOut(UserBase):
    """Schema de saída de usuário."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ======================
# IMOVEL
# ======================
class ImovelBase(BaseModel):
    """Campos comuns de imóvel."""

    codigo: str = Field(min_length=2, max_length=50)
    tipo: str = Field(min_length=2, max_length=60)
    preco: Decimal = Field(gt=0)
    quartos: int = Field(ge=0, le=50)
    banheiros: int = Field(ge=0, le=50)
    area: Decimal = Field(gt=0)
    endereco: str = Field(min_length=5, max_length=255)
    descricao: str = Field(min_length=5, max_length=5000)
    fotos_urls: list[str] = Field(default_factory=list)
    ativo: bool = True

    @field_validator("fotos_urls")
    @classmethod
    def validar_fotos_urls(cls, value: list[str]) -> list[str]:
        """Valida URLs básicas de fotos."""
        for url in value:
            if not (url.startswith("http://") or url.startswith("https://")):
                raise ValueError("Cada URL de foto deve iniciar com http:// ou https://")
        return value


class ImovelCreate(ImovelBase):
    """Schema para criação de imóvel."""


class ImovelUpdate(BaseModel):
    """Schema para atualização de imóvel."""

    codigo: Optional[str] = Field(default=None, min_length=2, max_length=50)
    tipo: Optional[str] = Field(default=None, min_length=2, max_length=60)
    preco: Optional[Decimal] = Field(default=None, gt=0)
    quartos: Optional[int] = Field(default=None, ge=0, le=50)
    banheiros: Optional[int] = Field(default=None, ge=0, le=50)
    area: Optional[Decimal] = Field(default=None, gt=0)
    endereco: Optional[str] = Field(default=None, min_length=5, max_length=255)
    descricao: Optional[str] = Field(default=None, min_length=5, max_length=5000)
    fotos_urls: Optional[list[str]] = None
    ativo: Optional[bool] = None


class ImovelOut(ImovelBase):
    """Schema de saída de imóvel."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ======================
# LEAD
# ======================
class LeadBase(BaseModel):
    """Campos comuns de lead."""

    nome: str = Field(min_length=2, max_length=120)
    telefone: str = Field(min_length=8, max_length=30)
    email: EmailStr
    mensagem: str = Field(min_length=5, max_length=3000)
    imovel_interesse: str = Field(min_length=1, max_length=100)
    status: str = Field(default="novo", max_length=40)
    origem: str = Field(default="site", max_length=60)


class LeadCreate(LeadBase):
    """Schema para criação de lead."""


class LeadUpdate(BaseModel):
    """Schema para atualização de lead."""

    nome: Optional[str] = Field(default=None, min_length=2, max_length=120)
    telefone: Optional[str] = Field(default=None, min_length=8, max_length=30)
    email: Optional[EmailStr] = None
    mensagem: Optional[str] = Field(default=None, min_length=5, max_length=3000)
    imovel_interesse: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[str] = Field(default=None, max_length=40)
    origem: Optional[str] = Field(default=None, max_length=60)


class LeadOut(LeadBase):
    """Schema de saída de lead."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
