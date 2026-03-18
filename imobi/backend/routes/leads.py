"""Rotas CRUD de leads."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.config.database import get_db
from backend.models.lead import Lead
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.imovel import LeadCreate, LeadOut, LeadUpdate
from backend.services.gemini_service import GeminiService

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.post("/", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def criar_lead(
    payload: LeadCreate,
    db: Annotated[Session, Depends(get_db)],
) -> Lead:
    """Cria lead (endpoint aberto para captura pública)."""
    item = Lead(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[LeadOut])
def listar_leads(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
) -> list[Lead]:
    """Lista leads com paginação."""
    return db.query(Lead).order_by(Lead.id.desc()).offset(skip).limit(limit).all()


@router.get("/{lead_id}", response_model=LeadOut)
def buscar_lead(
    lead_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> Lead:
    """Busca lead por ID."""
    item = db.query(Lead).filter(Lead.id == lead_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    return item


@router.put("/{lead_id}", response_model=LeadOut)
def atualizar_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> Lead:
    """Atualiza lead."""
    item = db.query(Lead).filter(Lead.id == lead_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")

    dados = payload.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(item, campo, valor)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_lead(
    lead_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> None:
    """Remove lead."""
    item = db.query(Lead).filter(Lead.id == lead_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    db.delete(item)
    db.commit()
    return None


@router.post("/gerar-mensagem/{lead_id}")
def gerar_mensagem_ia(
    lead_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Gera mensagem de contato para lead com IA Gemini."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")

    try:
        service = GeminiService()
        texto = service.gerar_descricao_imovel(
            {
                "lead_nome": lead.nome,
                "imovel_interesse": lead.imovel_interesse,
                "origem": lead.origem,
                "objetivo": "Gerar mensagem comercial inicial para contato via WhatsApp",
            }
        )
        return {"mensagem": texto}
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar mensagem com IA: {str(exc)}",
        ) from exc
