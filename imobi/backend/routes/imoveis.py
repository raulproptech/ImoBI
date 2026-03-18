"""Rotas CRUD de imóveis."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.models.imovel import Imovel
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.imovel import ImovelCreate, ImovelOut, ImovelUpdate

router = APIRouter(prefix="/imoveis", tags=["Imóveis"])


@router.post("/", response_model=ImovelOut, status_code=status.HTTP_201_CREATED)
def criar_imovel(
    payload: ImovelCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> Imovel:
    """Cria um novo imóvel."""
    existente = db.query(Imovel).filter(Imovel.codigo == payload.codigo).first()
    if existente:
        raise HTTPException(status_code=400, detail="Já existe imóvel com este código.")

    item = Imovel(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[ImovelOut])
def listar_imoveis(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
) -> list[Imovel]:
    """Lista imóveis com paginação."""
    return db.query(Imovel).order_by(Imovel.id.desc()).offset(skip).limit(limit).all()


@router.get("/{imovel_id}", response_model=ImovelOut)
def buscar_imovel(
    imovel_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> Imovel:
    """Busca um imóvel por ID."""
    item = db.query(Imovel).filter(Imovel.id == imovel_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    return item


@router.put("/{imovel_id}", response_model=ImovelOut)
def atualizar_imovel(
    imovel_id: int,
    payload: ImovelUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> Imovel:
    """Atualiza um imóvel."""
    item = db.query(Imovel).filter(Imovel.id == imovel_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")

    dados = payload.model_dump(exclude_unset=True)
    if "codigo" in dados:
        outro = db.query(Imovel).filter(Imovel.codigo == dados["codigo"], Imovel.id != imovel_id).first()
        if outro:
            raise HTTPException(status_code=400, detail="Já existe outro imóvel com este código.")

    for campo, valor in dados.items():
        setattr(item, campo, valor)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{imovel_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_imovel(
    imovel_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> None:
    """Remove um imóvel."""
    item = db.query(Imovel).filter(Imovel.id == imovel_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")

    db.delete(item)
    db.commit()
    return None
