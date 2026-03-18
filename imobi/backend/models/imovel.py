"""Modelo SQLAlchemy para imóveis."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from backend.config.database import Base


class Imovel(Base):
    """Representa um imóvel cadastrado na plataforma."""

    __tablename__ = "imoveis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(60), nullable=False)
    preco: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    quartos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    banheiros: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    area: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    endereco: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    fotos_urls: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
