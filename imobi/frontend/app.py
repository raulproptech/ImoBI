"""Frontend Reflex para o sistema Imobi."""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx
import reflex as rx
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


class ImobiState(rx.State):
    """Estado global do frontend."""

    email: str = ""
    password: str = ""
    token: str = ""
    erro: str = ""
    mensagem: str = ""

    # Métricas
    total_imoveis: int = 0
    total_leads: int = 0

    # Imóveis
    imoveis: list[dict[str, Any]] = []
    imovel_id_editando: Optional[int] = None
    codigo: str = ""
    tipo: str = ""
    preco: str = ""
    quartos: str = "0"
    banheiros: str = "0"
    area: str = ""
    endereco: str = ""
    descricao: str = ""
    fotos_urls_raw: str = ""
    ativo: bool = True

    # Leads
    leads: list[dict[str, Any]] = []

    async def _request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[dict] = None,
        auth: bool = True,
    ) -> dict | list:
        """Helper para chamadas HTTP ao backend."""
        headers = {"Content-Type": "application/json"}
        if auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        url = f"{API_BASE_URL}{endpoint}"

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.request(method, url, headers=headers, json=json_data)

        if resp.status_code >= 400:
            try:
                payload = resp.json()
                detail = payload.get("detail") or payload.get("erro") or str(payload)
            except Exception:
                detail = resp.text
            raise ValueError(f"Erro {resp.status_code}: {detail}")

        if not resp.content:
            return {}
        return resp.json()

    async def login(self) -> None:
        """Faz login e salva token."""
        self.erro = ""
        self.mensagem = ""

        if not self.email or not self.password:
            self.erro = "Preencha email e senha."
            return

        try:
            payload = {"email": self.email, "password": self.password}
            data = await self._request("POST", "/auth/login", payload, auth=False)
            self.token = data["access_token"]
            self.mensagem = "Login realizado com sucesso."
            await self.carregar_dashboard()
            await self.listar_imoveis()
            await self.listar_leads()
            return rx.redirect("/dashboard")
        except Exception as exc:
            self.erro = str(exc)

    def logout(self) -> rx.event.EventSpec:
        """Encerra sessão local."""
        self.token = ""
        self.email = ""
        self.password = ""
        self.erro = ""
        self.mensagem = "Sessão encerrada."
        return rx.redirect("/")

    async def carregar_dashboard(self) -> None:
        """Carrega métricas principais."""
        self.erro = ""
        try:
            imoveis = await self._request("GET", "/imoveis/?skip=0&limit=200")
            leads = await self._request("GET", "/leads/?skip=0&limit=200")
            self.total_imoveis = len(imoveis)
            self.total_leads = len(leads)
        except Exception as exc:
            self.erro = str(exc)

    async def listar_imoveis(self) -> None:
        """Busca lista de imóveis."""
        self.erro = ""
        try:
            data = await self._request("GET", "/imoveis/?skip=0&limit=50")
            self.imoveis = data
        except Exception as exc:
            self.erro = str(exc)

    async def listar_leads(self) -> None:
        """Busca lista de leads."""
        self.erro = ""
        try:
            data = await self._request("GET", "/leads/?skip=0&limit=50")
            self.leads = data
        except Exception as exc:
            self.erro = str(exc)

    def limpar_form_imovel(self) -> None:
        """Limpa formulário de imóvel."""
        self.imovel_id_editando = None
        self.codigo = ""
        self.tipo = ""
        self.preco = ""
        self.quartos = "0"
        self.banheiros = "0"
        self.area = ""
        self.endereco = ""
        self.descricao = ""
        self.fotos_urls_raw = ""
        self.ativo = True
        self.erro = ""
        self.mensagem = ""

    def editar_imovel(self, item: dict) -> rx.event.EventSpec:
        """Preenche formulário para edição."""
        self.imovel_id_editando = item.get("id")
        self.codigo = item.get("codigo", "")
        self.tipo = item.get("tipo", "")
        self.preco = str(item.get("preco", ""))
        self.quartos = str(item.get("quartos", 0))
        self.banheiros = str(item.get("banheiros", 0))
        self.area = str(item.get("area", ""))
        self.endereco = item.get("endereco", "")
        self.descricao = item.get("descricao", "")
        self.fotos_urls_raw = "\n".join(item.get("fotos_urls", []))
        self.ativo = bool(item.get("ativo", True))
        self.mensagem = "Modo edição ativado."
        return rx.redirect("/imoveis/form")

    async def salvar_imovel(self) -> None:
        """Cria ou atualiza imóvel."""
        self.erro = ""
        self.mensagem = ""

        try:
            fotos = [u.strip() for u in self.fotos_urls_raw.splitlines() if u.strip()]
            payload = {
                "codigo": self.codigo,
                "tipo": self.tipo,
                "preco": float(self.preco),
                "quartos": int(self.quartos),
                "banheiros": int(self.banheiros),
                "area": float(self.area),
                "endereco": self.endereco,
                "descricao": self.descricao,
                "fotos_urls": fotos,
                "ativo": self.ativo,
            }

            if self.imovel_id_editando is None:
                await self._request("POST", "/imoveis/", payload)
                self.mensagem = "Imóvel cadastrado com sucesso."
            else:
                await self._request("PUT", f"/imoveis/{self.imovel_id_editando}", payload)
                self.mensagem = "Imóvel atualizado com sucesso."

            await self.listar_imoveis()
            await self.carregar_dashboard()
            self.limpar_form_imovel()
            return rx.redirect("/imoveis")
        except Exception as exc:
            self.erro = str(exc)

    async def excluir_imovel(self, imovel_id: int) -> None:
        """Exclui imóvel."""
        self.erro = ""
        self.mensagem = ""
        try:
            await self._request("DELETE", f"/imoveis/{imovel_id}")
            self.mensagem = "Imóvel removido com sucesso."
            await self.listar_imoveis()
            await self.carregar_dashboard()
        except Exception as exc:
            self.erro = str(exc)


def _layout(titulo: str, conteudo: rx.Component) -> rx.Component:
    """Layout base com menu."""
    return rx.box(
        rx.hstack(
            rx.heading("Imobi", size="7"),
            rx.spacer(),
            rx.cond(
                ImobiState.token != "",
                rx.button("Logout", color_scheme="red", on_click=ImobiState.logout),
                rx.box(),
            ),
            width="100%",
            padding="1rem",
            border_bottom="1px solid #E2E8F0",
        ),
        rx.hstack(
            rx.cond(
                ImobiState.token != "",
                rx.vstack(
                    rx.link("Dashboard", href="/dashboard"),
                    rx.link("Imóveis", href="/imoveis"),
                    rx.link("Novo Imóvel", href="/imoveis/form"),
                    rx.link("Leads", href="/leads"),
                    align_items="flex-start",
                    spacing="3",
                    padding="1rem",
                    width="230px",
                    border_right="1px solid #E2E8F0",
                    min_height="calc(100vh - 80px)",
                ),
                rx.box(),
            ),
            rx.box(
                rx.heading(titulo, size="6", margin_bottom="1rem"),
                rx.cond(ImobiState.erro != "", rx.callout(ImobiState.erro, color_scheme="red"), rx.box()),
                rx.cond(
                    ImobiState.mensagem != "",
                    rx.callout(ImobiState.mensagem, color_scheme="green"),
                    rx.box(),
                ),
                conteudo,
                width="100%",
                padding="1rem",
            ),
            width="100%",
            align_items="start",
        ),
        width="100%",
    )


def index() -> rx.Component:
    """Tela de login."""
    return _layout(
        "Login",
        rx.vstack(
            rx.input(
                placeholder="Email",
                value=ImobiState.email,
                on_change=ImobiState.set_email,
                width="320px",
            ),
            rx.input(
                type="password",
                placeholder="Senha",
                value=ImobiState.password,
                on_change=ImobiState.set_password,
                width="320px",
            ),
            rx.button("Entrar", on_click=ImobiState.login, width="320px"),
            align_items="flex-start",
            spacing="3",
        ),
    )


def dashboard_page() -> rx.Component:
    """Dashboard principal com cards."""
    return _layout(
        "Dashboard",
        rx.vstack(
            rx.hstack(
                rx.card(
                    rx.vstack(
                        rx.text("Total de Imóveis", size="2"),
                        rx.heading(ImobiState.total_imoveis, size="8"),
                    ),
                    width="300px",
                ),
                rx.card(
                    rx.vstack(
                        rx.text("Total de Leads", size="2"),
                        rx.heading(ImobiState.total_leads, size="8"),
                    ),
                    width="300px",
                ),
                spacing="4",
                wrap="wrap",
            ),
            spacing="4",
            on_mount=ImobiState.carregar_dashboard,
        ),
    )


def imoveis_page() -> rx.Component:
    """Listagem de imóveis."""
    return _layout(
        "Imóveis",
        rx.vstack(
            rx.button("Atualizar lista", on_click=ImobiState.listar_imoveis),
            rx.table.root(
                rx.table.header(
                    rx.table.row(
                        rx.table.column_header_cell("Código"),
                        rx.table.column_header_cell("Tipo"),
                        rx.table.column_header_cell("Preço"),
                        rx.table.column_header_cell("Quartos"),
                        rx.table.column_header_cell("Ações"),
                    )
                ),
                rx.table.body(
                    rx.foreach(
                        ImobiState.imoveis,
                        lambda item: rx.table.row(
                            rx.table.cell(item["codigo"]),
                            rx.table.cell(item["tipo"]),
                            rx.table.cell(f"R$ {item['preco']}"),
                            rx.table.cell(item["quartos"]),
                            rx.table.cell(
                                rx.hstack(
                                    rx.button("Editar", on_click=lambda i=item: ImobiState.editar_imovel(i)),
                                    rx.button(
                                        "Excluir",
                                        color_scheme="red",
                                        on_click=lambda im_id=item["id"]: ImobiState.excluir_imovel(im_id),
                                    ),
                                )
                            ),
                        ),
                    )
                ),
                variant="surface",
                width="100%",
            ),
            on_mount=ImobiState.listar_imoveis,
            width="100%",
            spacing="4",
        ),
    )


def imovel_form_page() -> rx.Component:
    """Formulário de cadastro/edição de imóvel."""
    return _layout(
        "Cadastro / Edição de Imóvel",
        rx.vstack(
            rx.input(placeholder="Código", value=ImobiState.codigo, on_change=ImobiState.set_codigo),
            rx.input(placeholder="Tipo", value=ImobiState.tipo, on_change=ImobiState.set_tipo),
            rx.input(placeholder="Preço", value=ImobiState.preco, on_change=ImobiState.set_preco),
            rx.input(placeholder="Quartos", value=ImobiState.quartos, on_change=ImobiState.set_quartos),
            rx.input(placeholder="Banheiros", value=ImobiState.banheiros, on_change=ImobiState.set_banheiros),
            rx.input(placeholder="Área (m²)", value=ImobiState.area, on_change=ImobiState.set_area),
            rx.input(placeholder="Endereço", value=ImobiState.endereco, on_change=ImobiState.set_endereco),
            rx.text_area(
                placeholder="Descrição",
                value=ImobiState.descricao,
                on_change=ImobiState.set_descricao,
                min_height="120px",
            ),
            rx.text_area(
                placeholder="Fotos (uma URL por linha)",
                value=ImobiState.fotos_urls_raw,
                on_change=ImobiState.set_fotos_urls_raw,
                min_height="120px",
            ),
            rx.hstack(
                rx.switch(checked=ImobiState.ativo, on_change=ImobiState.set_ativo),
                rx.text("Imóvel ativo"),
            ),
            rx.hstack(
                rx.button("Salvar", on_click=ImobiState.salvar_imovel),
                rx.button("Limpar", variant="surface", on_click=ImobiState.limpar_form_imovel),
            ),
            width="100%",
            max_width="700px",
            spacing="3",
        ),
    )


def leads_page() -> rx.Component:
    """Listagem de leads."""
    return _layout(
        "Leads",
        rx.vstack(
            rx.button("Atualizar lista", on_click=ImobiState.listar_leads),
            rx.table.root(
                rx.table.header(
                    rx.table.row(
                        rx.table.column_header_cell("Nome"),
                        rx.table.column_header_cell("Telefone"),
                        rx.table.column_header_cell("Email"),
                        rx.table.column_header_cell("Interesse"),
                        rx.table.column_header_cell("Status"),
                    )
                ),
                rx.table.body(
                    rx.foreach(
                        ImobiState.leads,
                        lambda item: rx.table.row(
                            rx.table.cell(item["nome"]),
                            rx.table.cell(item["telefone"]),
                            rx.table.cell(item["email"]),
                            rx.table.cell(item["imovel_interesse"]),
                            rx.table.cell(item["status"]),
                        ),
                    )
                ),
                variant="surface",
                width="100%",
            ),
            on_mount=ImobiState.listar_leads,
            width="100%",
            spacing="4",
        ),
    )


app = rx.App()
app.add_page(index, route="/", title="Imobi - Login")
app.add_page(dashboard_page, route="/dashboard", title="Imobi - Dashboard")
app.add_page(imoveis_page, route="/imoveis", title="Imobi - Imóveis")
app.add_page(imovel_form_page, route="/imoveis/form", title="Imobi - Formulário de Imóvel")
app.add_page(leads_page, route="/leads", title="Imobi - Leads")
