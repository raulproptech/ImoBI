"""Serviço de integração com Google Gemini."""

from __future__ import annotations

import os
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


class GeminiService:
    """Camada de serviço para geração de textos com Gemini."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None) -> None:
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name or GEMINI_MODEL

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada no ambiente.")

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)

    def gerar_descricao_imovel(self, dados_imovel: dict) -> str:
        """Gera uma descrição comercial do imóvel com base nos dados informados."""
        prompt = (
            "Você é um especialista imobiliário. Gere uma descrição comercial objetiva e persuasiva "
            "em português para o imóvel abaixo:\n"
            f"{dados_imovel}"
        )
        resposta = self.model.generate_content(prompt)
        texto = (resposta.text or "").strip()
        if not texto:
            return "Não foi possível gerar descrição no momento."
        return texto
