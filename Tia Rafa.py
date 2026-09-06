import streamlit as st
import urllib.parse
import base64
from datetime import datetime
from supabase import create_client, Client
import streamlit.components.v1 as components

# -------------------------------------------------------------
# CONFIGURAÇÃO DA PÁGINA & ESTILIZAÇÃO CSS
# -------------------------------------------------------------
st.set_page_config(
    page_title="App Tia Rafa - Transporte Escolar", 
    page_icon="🚗", 
    layout="centered",
    initial_sidebar_state="expanded"
)

st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    .stApp {
        background-color: #f8f9fa;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .main-header {
        background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
        padding: 22px;
        border-radius: 18px;
        color: #1e1e1e;
        text-align: center;
        margin-bottom: 25px;
        box-shadow: 0 6px 12px rgba(255, 152, 0, 0.15);
    }
    .main-header h1 {
        margin: 0;
        font-weight: 800;
        font-size: 2.2rem;
        color: #000;
    }
    .main-header p {
        margin: 5px 0 0 0;
        font-size: 1.1rem;
        opacity: 0.9;
    }
    
    .stButton>button {
        width: 100%;
        border-radius: 12px;
        height: 3.4em;
        font-weight: bold;
        font-size: 1.05rem;
        border: none;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    section[data-testid="stSidebar"] {
        background-color: #ffffff;
        border-right: 1px solid #e0e0e0;
    }
    
    .stTextInput>div>div>input, .stNumberInput>div>div>input, .stSelectbox>div>div>select {
        border-radius: 10px;
    }
    </style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------
# CONEXÃO COM O SUPABASE
# -------------------------------------------------------------
SUPABASE_URL = "https://sxrexcmtanpwljimfqpk.supabase.co"
SUPABASE_KEY = "sb_publishable_NM0fvyA5X1zlFVy39gvrYA_pyTXBisb"

@st.cache_resource
def init_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    supabase = init_supabase()
except Exception as e:
    st.error(f"Erro ao conectar ao banco de dados: {e}")
    st.stop()

BUCKET_ASSETS = "custom_assets"
NOME_ARQUIVO_VEICULO = "foto_veiculo_custom.jpg"

# --- FUNÇÕES DE STORAGE ---
def upload_imagem_veiculo(file_bytes, content_type):
    try:
        supabase.storage.from_(BUCKET_ASSETS).remove([NOME_ARQUIVO_VEICULO])
    except:
        pass
    
    res = supabase.storage.from_(BUCKET_ASSETS).upload(
        path=NOME_ARQUIVO_VEICULO,
        file=file_bytes,
        file_options={"content-type": content_type}
    )
    return res

def obter_url_publica_veiculo():
    try:
        arquivos = supabase.storage.from_(BUCKET_ASSETS).list()
        if any(f.get('name') == NOME_ARQUIVO_VEICULO for f in arquivos):
            return supabase.storage.from_(BUCKET_ASSETS).get_public_url(NOME_ARQUIVO_VEICULO)
        return None
    except Exception:
        return None

# --- FUNÇÕES DE DADOS (DB) ---
def obter_alunos():
    res = supabase.table("alunos").select("*").order("horario_busca").execute()
    return res.data if res.data else []

def obter_alerta_ativo():
    res = supabase.table("alertas").select("*").eq("ativo", True).order("id", desc=True).limit(1).execute()
    return res.data[0] if res.data else None

def obter_configuracoes():
    res = supabase.table("configuracoes").select("*").order("id").limit(1).execute()
    if res.data:
        return res.data[0]
    return {"chave_pix": "Chave não cadastrada", "senha_acesso": "rafa123", "senha_admin": "admin123", "link_cartao": ""}

def obter_historico_aluno(aluno_id):
    res = supabase.table("historico_financeiro").select("*").eq("aluno_id", aluno_id).order("id", desc=True).execute()
    return res.data if res.data else []

def obter_coordenadas_van():
    res = supabase.table("van_gps").select("*").order("id", desc=True).limit(1).execute()
    if res.data:
        return res.data[0]
    return {"latitude": -23.550520, "longitude": -46.633308}

def obter_emergencia_ativa():
    res = supabase.table("emergencias").select("*").eq("resolvido", False).order("id", desc=True).limit(1).execute()
    return res.data[0] if res.data else None

config = obter_configuracoes()
SENHA_MOTORISTA = config.get("senha_acesso", "rafa123")
SENHA_ADMIN = config.get("senha_admin", "admin123")
CHAVE_PIX_TIA_RAFA = config.get("chave_pix", "Cadastre a chave PIX nas configurações")
LINK_CARTAO_GERAL = config.get("link_cartao", "")

mes_atual_str = datetime.now().strftime("%m/%Y")
AVISO_ANUAL_TEXTO = "📌 **Aviso Importante sobre a Mensalidade:**\nO serviço de transporte escolar é contratado de forma **anual** (referente ao ano letivo completo) e o seu valor total é parcelado em **12 mensalidades iguais**, de janeiro a dezembro (incluindo o período de férias escolares)."

# -------------------------------------------------------------
# TOPO DO APLICATIVO
# -------------------------------------------------------------
st.markdown("""
    <div class="main-header">
        <h1>🚗 App Tia Rafa</h1>
        <p>Transporte Escolar & Recreativo Seguro</p>
    </div>
""", unsafe_allow_html=True)

alerta_atual = obter_alerta_ativo()
if alerta_atual:
    st.error(f"🚨 **AVISO DE ROTA:** {alerta_atual['mensagem']}")

# MENU LATERAL
url_customizada = obter_url_publica_veiculo()
imagem_final_sidebar = url_customizada if url_customizada else "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f690.svg"

if url_customizada:
    st.sidebar.image(imagem_final_sidebar, use_container_width=True)
else:
    st.sidebar.image(imagem_final_sidebar, width=120)

st.sidebar.title("Navegação")

opcoes_menu = [
    "👩‍👧‍👦 Espaço dos Pais", 
    "👩‍✈️ Painel da Tia Rafa", 
    "➕ Cadastrar Aluno"
]

if st.session_state.get("admin_autenticado", False):
    opcoes_menu.append("👨‍💻 Painel do Programador")

perfil = st.sidebar.radio("Selecione o acesso:", opcoes_menu)

st.sidebar.divider()
with st.sidebar.expander("🔑 Áreas Restritas / Suporte"):
    if not st.session_state.get("admin_autenticado", False):
        senha_dev = st.text_input("Senha Programador:", type="password", key="senha_dev_input")
        if st.button("🔓 Liberar Painel Dev"):
            if senha_dev == SENHA_ADMIN:
                st.session_state.admin_autenticado = True
                st.sidebar.success("Painel liberado!")
                st.rerun()
            else:
                st.sidebar.error("Senha incorreta!")
    else:
        st.sidebar.success("🟢 Modo Programador Ativo")
        if st.sidebar.button("🔒 Bloquear / Ocultar Painel"):
            st.session_state.admin_autenticado = False
            st.rerun()

alunos = obter_alunos()

# ==========================================
# 1. PAINEL DO PROGRAMADOR
# ==========================================
if perfil == "👨‍💻 Painel do Programador":
    st.subheader("👑 Painel do Programador — Controle Total")
    
    if st.button("🚪 Sair e Ocultar Modo Admin"):
        st.session_state.admin_autenticado = False
        st.rerun()

    emergencia = obter_emergencia_ativa()
    if emergencia:
        st.error(f"🚨 **ALERTA DE SOCORRO RECEBIDO:** {emergencia['tipo'].upper()}")
        st.caption(f"Horário do chamado: {emergencia.get('criado_em')}")
        
        sound_html = """
        <audio autoplay loop>
            <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg">
        </audio>
        """
        components.html(sound_html, height=0)

        lat_e = emergencia.get("latitude")
        lng_e = emergencia.get("longitude")
        
        if lat_e and lng_e:
            st.markdown(f"### 📍 [🚨 CLIQUE AQUI PARA ABRIR GPS DIRETO](https://www.google.com/maps/search/?api=1&query={lat_e},{lng_e})")
        
        if st.button("✅ Confirmar Atendimento / Encerrar Socorro"):
            supabase.table("emergencias").update({"resolvido": True}).eq("id", emergencia["id"]).execute()
            st.success("Atendimento registrado com sucesso!")
            st.rerun()
        st.divider()

    aba_gps_dev, aba_dados_dev, aba_config_dev = st.tabs(["🛰️ GPS & Rastreamento", "🛠️ Gerenciador de Alunos", "⚙️ Configurações Globais"])

    with aba_gps_dev:
        st.write("### 🛰️ Rastreamento Visual em Tempo Real")
        coords = obter_coordenadas_van()
        lat_van = coords.get("latitude", -23.550520)
        lng_van = coords.get("longitude", -46.633308)

        mapa_admin_html = f"""
        <iframe 
            width="100%" 
            height="320" 
            frameborder="0" 
            scrolling="no" 
            marginheight="0" 
            marginwidth="0" 
            src="https://www.openstreetmap.org/export/embed.html?bbox={lng_van-0.01}%2C{lat_van-0.01}%2C{lng_van+0.01}%2C{lat_van+0.01}&amp;layer=mapnik&amp;marker={lat_van}%2C{lng_van}">
        </iframe>
        <br/><small><a href="https://www.openstreetmap.org/?mlat={lat_van}&amp;mlon={lng_van}#map=16/{lat_van}/{lng_van}" target="_blank">🔍 Ver no Google Maps / Mapa Ampliado</a></small>
        """
        components.html(mapa_admin_html, height=350)

        col_c1, col_c2 = st.columns(2)
        col_c1.caption(f"Lat: {lat_van}")
        col_c2.caption(f"Lng: {lng_van}")

        st.divider()
        st.write("🧪 **Simulador de Coordenadas GPS:**")
        nova_lat = st.number_input("Nova Latitude:", value=float(lat_van), format="%.6f")
        nova_lng = st.number_input("Nova Longitude:", value=float(lng_van), format="%.6f")
        
        if st.button("📡 Enviar Nova Posição ao Banco"):
            supabase.table("van_gps").insert({"latitude": nova_lat, "longitude": nova_lng}).execute()
            st.toast("Coordenadas atualizadas no mapa!")
            st.rerun()

    with aba_dados_dev:
        st.write("### 🛠️ Correção e Edição Direta do Banco de Dados")
        if not alunos:
            st.info("Nenhum aluno cadastrado no banco.")
        else:
            aluno_dev_nome = st.selectbox("Selecione o aluno para correção:", [a["nome"] for a in alunos], key="dev_sel_aluno")
            aluno_dev = next(a for a in alunos if a["nome"] == aluno_dev_nome)

            with st.form("form_dev_aluno"):
                dev_nome = st.text_input("Nome:", value=aluno_dev.get("nome", ""))
                dev_email = st.text_input("E-mail Mãe:", value=aluno_dev.get("email_mae", ""))
                dev_valor = st.number_input("Valor Mensalidade (R$):", value=float(aluno_dev.get("valor", 180.00)))
                dev_status_pag = st.selectbox("Status Pagamento:", ["Pendente", "Aguardando Aprovação", "Pago"], index=["Pendente", "Aguardando Aprovação", "Pago"].index(aluno_dev.get("status_pagamento", "Pendente")))
                dev_gps = st.toggle("GPS Habilitado", value=bool(aluno_dev.get("gps_liberado", False)))

                if st.form_submit_button("💾 Aplicar Correção de Emergência"):
                    supabase.table("alunos").update({
                        "nome": dev_nome,
                        "email_mae": dev_email,
                        "valor": dev_valor,
                        "status_pagamento": dev_status_pag,
                        "gps_liberado": dev_gps
                    }).eq("id", aluno_dev["id"]).execute()
                    st.success("Dados corrigidos com sucesso!")
                    st.rerun()

            st.divider()
            if st.button("❌ EXCLUIR ESTE ALUNO DO BANCO DE DADOS", type="primary"):
                supabase.table("alunos").delete().eq("id", aluno_dev["id"]).execute()
                st.warning("Aluno removido do banco!")
                st.rerun()

    with aba_config_dev:
        st.write("### 🛠️ Configurações do Sistema")
        with st.form("form_senhas_admin"):
            nova_senha_motorista = st.text_input("Alterar Senha do Painel da Tia Rafa:", value=SENHA_MOTORISTA)
            nova_senha_admin = st.text_input("Alterar Senha Mestra:", value=SENHA_ADMIN, type="password")
            novo_link_cartao = st.text_input("Link Padrão do Cartão (Geral R$ 180):", value=LINK_CARTAO_GERAL)
            
            if st.form_submit_button("💾 Salvar Configurações Globais"):
                if config.get("id"):
                    supabase.table("configuracoes").update({
                        "senha_acesso": nova_senha_motorista,
                        "senha_admin": nova_senha_admin,
                        "link_cartao": novo_link_cartao
                    }).eq("id", config["id"]).execute()
                st.success("Configurações salvas!")
                st.rerun()

# ==========================================
# 2. PAINEL DA TIA RAFA
# ==========================================
elif perfil == "👩‍✈️ Painel da Tia Rafa":
    st.subheader("🔒 Acesso Restrito")
    
    if "autenticado" not in st.session_state:
        st.session_state.autenticado = False

    if not st.session_state.autenticado:
        senha_input = st.text_input("Digite a senha da Tia Rafa:", type="password")
        if st.button("🔓 Entrar no Painel"):
            if senha_input == SENHA_MOTORISTA:
                st.session_state.autenticado = True
                st.success("Acesso liberado!")
                st.rerun()
            else:
                st.error("Senha incorreta!")
    else:
        col_out1, col_out2 = st.columns([3, 1])
        with col_out2:
            if st.button("🚪 Sair"):
                st.session_state.autenticado = False
                st.rerun()

        st.write("### 🔔 Central de Comunicação de Imprevistos")
        
        with st.expander("🆘 **CHAMAR SOCORRO (SÓ PARA O PROGRAMADOR)**", expanded=False):
            st.error("Use este botão caso precise que o suporte venha até o local onde você está:")
            tipo_emergencia = st.selectbox("O que aconteceu com o veículo/você?", [
                "🛠️ Problema Mecânico / Pneu Furado", 
                "🤢 Emergência de Saúde / Passando Mal", 
                "⚠️ Outro Imprevisto Grave"
            ])
            
            if st.button("🚨 DISPARAR ALERTA SONORO DE SOCORRO"):
                coords = obter_coordenadas_van()
                supabase.table("emergencias").insert({
                    "tipo": tipo_emergencia,
                    "latitude": coords.get("latitude"),
                    "longitude": coords.get("longitude"),
                    "resolvido": False
                }).execute()
                st.error("🚨 Chamado enviado! O programador recebeu o alerta sonoro e sua posição no mapa.")

        with st.expander("📢 **AVISAR ATRASO / IMPREVISTO (PARA TODOS OS PAIS)**", expanded=False):
            st.warning("Envios rápidos de 1 clique ou digite sua mensagem:")
            
            col_b1, col_b2, col_b3 = st.columns(3)
            if col_b1.button("⏱️ Atraso 10 min"):
                supabase.table("alertas").update({"ativo": False}).eq("ativo", True).execute()
                supabase.table("alertas").insert({"tipo": "⏱️ Atraso", "mensagem": "⏱️ Pequeno atraso na rota (Aproximadamente 10 minutos). Crianças em segurança!", "ativo": True}).execute()
                st.success("Aviso enviado!")
                st.rerun()
            if col_b2.button("🚗 Trânsito Forte"):
                supabase.table("alertas").update({"ativo": False}).eq("ativo", True).execute()
                supabase.table("alertas").insert({"tipo": "🚗 Trânsito", "mensagem": "🚗 Trânsito intenso na via. Estamos avançando devagar e em segurança.", "ativo": True}).execute()
                st.success("Aviso enviado!")
                st.rerun()
            if col_b3.button("🌧️ Chuva Forte"):
                supabase.table("alertas").update({"ativo": False}).eq("ativo", True).execute()
                supabase.table("alertas").insert({"tipo": "🌧️ Chuva", "mensagem": "🌧️ Chuva forte na região. Velocidade reduzida por segurança.", "ativo": True}).execute()
                st.success("Aviso enviado!")
                st.rerun()

            st.divider()
            motivo_pais = st.selectbox(
                "Ou escolha outro aviso personalizado:",
                ["⏱️ Atraso Geral na Rota", "🚗 Trânsito Intenso na Via", "🌧️ Chuva Forte / Alagamento", "🛠️ Pequena Parada Técnica"]
            )
            detalhes_pais = st.text_input("Mensagem explicativa:", value="Estamos parados com segurança. Todas as crianças estão bem.")
            
            col_m1, col_m2 = st.columns(2)
            with col_m1:
                if st.button("📢 Publicar Aviso Personalizado"):
                    supabase.table("alertas").update({"ativo": False}).eq("ativo", True).execute()
                    supabase.table("alertas").insert({"tipo": motivo_pais, "mensagem": f"{motivo_pais} - {detalhes_pais}", "ativo": True}).execute()
                    st.success("Aviso publicado na tela dos pais!")
                    st.rerun()
                    
            with col_m2:
                if alerta_atual and st.button("✅ Limpar Aviso dos Pais"):
                    supabase.table("alertas").update({"ativo": False}).eq("ativo", True).execute()
                    st.success("Aviso removido!")
                    st.rerun()

        st.divider()

        aba_rota, aba_financeiro, aba_gestao, aba_config = st.tabs(["📋 Rota do Dia", "💰 Financeiro", "✏️ Alunos & Permissão GPS", "⚙️ Configurações"])

        # --- ABA 1: ROTA DO DIA ---
        with aba_rota:
            filtro_turno = st.selectbox("Filtro de Rota por Turno:", ["Todos os Turnos", "Manhã", "Tarde"])
            
            alunos_filtrados = alunos
            if filtro_turno != "Todos os Turnos":
                alunos_filtrados = [a for a in alunos if a.get("turno", "Manhã") == filtro_turno]
                
            total_vao = len([a for a in alunos_filtrados if a.get("vai_hoje", True)])
            total_faltam = len([a for a in alunos_filtrados if not a.get("vai_hoje", True)])
            
            col_m_pres1, col_m_pres2 = st.columns(2)
            col_m_pres1.metric("Confirmados Hoje", f"🚗 {total_vao} alunos")
            col_m_pres2.metric("Não Irão Hoje", f"❌ {total_faltam} alunos")
            
            st.divider()

            alunos_presentes = [a for a in alunos_filtrados if a.get("vai_hoje", True)]
            
            if not alunos_presentes:
                st.info("Nenhum aluno marcado para ir hoje nesta rota!")
            
            for aluno in alunos_presentes:
                with st.container():
                    col_info, col_wsp = st.columns([3, 1])
                    with col_info:
                        gps_tag = "🛰️ GPS ON" if aluno.get("gps_liberado") else "🔒 GPS OFF"
                        st.markdown(f"### 👦👧 {aluno['nome']} `({aluno.get('turno', 'Manhã')})` `{gps_tag}`")
                        st.caption(f"🏫 {aluno.get('escola', '')} | ⏰ Busca: {aluno.get('horario_busca', '07:00')}")
                    with col_wsp:
                        wsp = aluno.get("whatsapp", "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
                        if wsp:
                            st.markdown(f"[📱 WhatsApp](https://wa.me/55{wsp})")

                    status_atual = aluno.get('status', 'Aguardando')
                    if status_atual == "Aguardando":
                        st.warning(f"🕒 Status: {status_atual}")
                    elif status_atual in ["Embarcou", "Na Rota", "Na Zafira", "Na Van"]:
                        st.info("🚗 Status: Na Rota")
                    elif status_atual in ["Desembarcou", "Entregue"]:
                        st.success("✅ Status: Desembarcou")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button("🚗 Embarcou", key=f"emb_{aluno['id']}"):
                            supabase.table("alunos").update({"status": "Embarcou"}).eq("id", aluno['id']).execute()
                            st.rerun()
                    with col2:
                        if st.button("✅ Desembarcou", key=f"ent_{aluno['id']}"):
                            supabase.table("alunos").update({"status": "Desembarcou"}).eq("id", aluno['id']).execute()
                            st.rerun()
                    
                    st.divider()

        # --- ABA 2: FINANCEIRO ---
        with aba_financeiro:
            st.subheader(f"💵 Mês Atual: {mes_atual_str}")
            
            if not alunos:
                st.info("Nenhum aluno cadastrado.")
            else:
                total_recebido = sum([float(a.get('valor', 180)) for a in alunos if a.get('status_pagamento') == 'Pago'])
                total_pendente = sum([float(a.get('valor', 180)) for a in alunos if a.get('status_pagamento') != 'Pago'])
                
                col_f1, col_f2 = st.columns(2)
                col_f1.metric("Recebido este mês", f"R$ {total_recebido:.2f}")
                col_f2.metric("Pendente", f"R$ {total_pendente:.2f}")
                
                st.divider()
                
                with st.expander("🔒 Encerrar Mês & Salvar no Histórico", expanded=False):
                    st.write("Grava o status atual no histórico mensal.")
                    if st.button("💾 Fechar Mês Atual e Abrir Novo"):
                        for a in alunos:
                            supabase.table("historico_financeiro").insert({
                                "aluno_id": a["id"],
                                "mes_ano": mes_atual_str,
                                "valor": a.get("valor", 180.00),
                                "status_pagamento": a.get("status_pagamento", "Pendente"),
                                "comprovante_url": a.get("comprovante_url")
                            }).execute()
                            
                            supabase.table("alunos").update({
                                "status_pagamento": "Pendente",
                                "comprovante_url": None,
                                "forma_pagamento": None
                            }).eq("id", a['id']).execute()
                            
                        st.success(f"Mês {mes_atual_str} encerrado com sucesso!")
                        st.rerun()

                st.divider()
                st.write("### 📋 Mensalidades do Mês:")
                
                for a in alunos:
                    status_pag = a.get('status_pagamento', 'Pendente')
                    forma_p = a.get('forma_pagamento', 'Não informado')
                    
                    with st.container():
                        col_a1, col_a2 = st.columns([2, 1])
                        with col_a1:
                            st.write(f"**{a['nome']}**")
                            st.caption(f"Valor: R$ {a.get('valor', 180.00):.2f} | Vencimento: Dia {a.get('vencimento', 10)}")
                        with col_a2:
                            if status_pag == "Pago":
                                st.success(f"🟢 Pago ({forma_p})")
                            elif status_pag == "Aguardando Aprovação":
                                st.warning("🟡 Comprovante PIX")
                            else:
                                st.error("🔴 Pendente")

                        if a.get("comprovante_url"):
                            comp_url = a["comprovante_url"]
                            with st.expander("🖼️ Ver Comprovante PIX Enviado"):
                                if "application/pdf" in comp_url:
                                    st.markdown(f"[📄 Clique aqui para abrir/baixar o comprovante em PDF]({comp_url})")
                                else:
                                    st.image(comp_url, use_container_width=True)

                        if status_pag != "Pago":
                            col_p1, col_p2, col_p3 = st.columns(3)
                            with col_p1:
                                if st.button("✅ PIX", key=f"pix_{a['id']}"):
                                    supabase.table("alunos").update({"status_pagamento": "Pago", "forma_pagamento": "PIX"}).eq("id", a['id']).execute()
                                    st.toast("Pago via PIX!")
                                    st.rerun()
                            with col_p2:
                                if st.button("💵 Dinheiro", key=f"din_{a['id']}"):
                                    supabase.table("alunos").update({"status_pagamento": "Pago", "forma_pagamento": "Dinheiro"}).eq("id", a['id']).execute()
                                    st.toast("Pago em Dinheiro!")
                                    st.rerun()
                            with col_p3:
                                if st.button("💳 Cartão", key=f"car_{a['id']}"):
                                    supabase.table("alunos").update({"status_pagamento": "Pago", "forma_pagamento": "Cartão"}).eq("id", a['id']).execute()
                                    st.toast("Pago no Cartão!")
                                    st.rerun()
                        else:
                            if st.button("↩️ Desfazer Pagamento", key=f"unpag_{a['id']}"):
                                supabase.table("alunos").update({"status_pagamento": "Pendente", "forma_pagamento": None}).eq("id", a['id']).execute()
                                st.rerun()

                        st.divider()

        # --- ABA 3: EDITAR ALUNOS ---
        with aba_gestao:
            st.subheader("✏️ Editar Dados & Configurações do Passageiro")
            
            if not alunos:
                st.info("Nenhum aluno cadastrado.")
            else:
                aluno_selecionado_nome = st.selectbox("Selecione o aluno para editar:", [a["nome"] for a in alunos])
                aluno_edit = next(a for a in alunos if a["nome"] == aluno_selecionado_nome)
                
                with st.form("form_edicao"):
                    edit_gps_liberado = st.toggle("📡 Liberar acompanhamento de GPS em tempo real para este pai", value=bool(aluno_edit.get("gps_liberado", False)))
                    
                    st.divider()
                    edit_nome = st.text_input("Nome do Aluno:", value=aluno_edit.get("nome", ""))
                    
                    col_t1, col_t2 = st.columns(2)
                    with col_t1:
                        edit_turno = st.selectbox("Turno da Rota:", ["Manhã", "Tarde"], index=0 if aluno_edit.get("turno") == "Manhã" else 1)
                    with col_t2:
                        edit_wsp = st.text_input("WhatsApp do Responsável:", value=aluno_edit.get("whatsapp", ""))

                    col_h1, col_h2 = st.columns(2)
                    with col_h1:
                        edit_horario_busca = st.text_input("⏰ Horário de Busca:", value=aluno_edit.get("horario_busca", "07:00"))
                    with col_h2:
                        edit_horario_escola = st.text_input("🏫 Horário da Escola:", value=aluno_edit.get("horario_escola", "07:30"))

                    edit_casa = st.text_input("Endereço Residencial:", value=aluno_edit.get("endereco_casa", ""))
                    edit_escola = st.text_input("Escola:", value=aluno_edit.get("escola", ""))
                    edit_end_escola = st.text_input("Endereço da Escola:", value=aluno_edit.get("endereco_escola", ""))
                    edit_email = st.text_input("E-mail do Responsável:", value=aluno_edit.get("email_mae", ""))
                    
                    st.divider()
                    st.write("💰 **Valores e Pagamentos Personalizados:**")
                    col_e1, col_e2 = st.columns(2)
                    with col_e1:
                        edit_valor = st.number_input("Valor Mensalidade (R$):", value=float(aluno_edit.get("valor", 180.00)), step=10.00)
                    with col_e2:
                        edit_venc = st.number_input("Dia de Vencimento:", min_value=1, max_value=31, value=int(aluno_edit.get("vencimento", 10)))
                    
                    edit_link_indiv = st.text_input("Link do Cartão Exclusivo (Opcional):", value=aluno_edit.get("link_pagamento_individual", ""), help="Deixe em branco para usar o link geral de cartão de R$ 180,00.")

                    salvar_edicao = st.form_submit_button("💾 Salvar Alterações")
                    
                    if salvar_edicao:
                        supabase.table("alunos").update({
                            "nome": edit_nome,
                            "gps_liberado": edit_gps_liberado,
                            "turno": edit_turno,
                            "whatsapp": edit_wsp,
                            "horario_busca": edit_horario_busca,
                            "horario_escola": edit_horario_escola,
                            "endereco_casa": edit_casa,
                            "escola": edit_escola,
                            "endereco_escola": edit_end_escola,
                            "email_mae": edit_email,
                            "valor": edit_valor,
                            "vencimento": edit_venc,
                            "link_pagamento_individual": edit_link_indiv
                        }).eq("id", aluno_edit["id"]).execute()
                        st.success("Dados salvos com sucesso!")
                        st.rerun()

        # --- ABA 4: CONFIGURAÇÕES ---
        with aba_config:
            st.subheader("⚙️ Configurações Gerais e Personalização")
            
            st.markdown("### 🖼️ Personalização do Visual do Aplicativo")
            with st.container():
                col_foto1, col_foto2 = st.columns([1, 2])
                with col_foto1:
                    st.write("**Imagem atual:**")
                    if url_customizada:
                        st.image(url_customizada, use_container_width=True)
                    else:
                        st.image("https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f690.svg", width=80)
                        st.caption("(Padrão)")
                
                with col_foto2:
                    st.write("**Substituir Imagem do Veículo na Barra Lateral:**")
                    nova_foto_veiculo = st.file_uploader("Anexe uma foto do veículo (Máx 5MB):", type=["png", "jpg", "jpeg"], key="uploader_veiculo")
                    
                    col_btn_f1, col_btn_f2 = st.columns(2)
                    with col_btn_f1:
                        if st.button("🚀 Aplicar Nova Foto", type="primary"):
                            if nova_foto_veiculo is not None:
                                if nova_foto_veiculo.size > 5 * 1024 * 1024:
                                    st.error("⚠️ O arquivo é maior que 5MB. Escolha uma imagem menor.")
                                else:
                                    file_bytes = nova_foto_veiculo.getvalue()
                                    content_type = nova_foto_veiculo.type
                                    upload_imagem_veiculo(file_bytes, content_type)
                                    st.success("Nova foto aplicada!")
                                    st.rerun()
                            else:
                                st.warning("Por favor, anexe uma imagem primeiro.")
                    
                    with col_btn_f2:
                        if url_customizada and st.button("↩️ Restaurar Padrão"):
                            supabase.storage.from_(BUCKET_ASSETS).remove([NOME_ARQUIVO_VEICULO])
                            st.success("Imagem padrão restaurada!")
                            st.rerun()
            
            st.divider()
            
            st.markdown("### 🔧 Configurações de Pagamento e Acesso")
            with st.form("form_config"):
                nova_chave_pix = st.text_input("🔑 Chave PIX Padrão:", value=CHAVE_PIX_TIA_RAFA)
                novo_link_cartao_geral = st.text_input("💳 Link Padrão do Cartão (Geral R$ 180,00):", value=LINK_CARTAO_GERAL)
                nova_senha = st.text_input("🔒 Senha do Painel da Tia Rafa:", value=SENHA_MOTORISTA, type="password")
                
                if st.form_submit_button("💾 Salvar Configurações"):
                    if config.get("id"):
                        supabase.table("configuracoes").update({
                            "chave_pix": nova_chave_pix,
                            "link_cartao": novo_link_cartao_geral,
                            "senha_acesso": nova_senha
                        }).eq("id", config["id"]).execute()
                    st.success("Configurações salvas com sucesso!")
                    st.cache_resource.clear()
                    st.rerun()

# ==========================================
# 3. TELA DE CADASTRO DE ALUNOS
# ==========================================
elif perfil == "➕ Cadastrar Aluno":
    st.subheader("📝 Cadastrar Novo Passageiro")
    
    with st.form("form_cadastro", clear_on_submit=True):
        nome = st.text_input("Nome completo da criança:")
        
        col_cad1, col_cad2 = st.columns(2)
        with col_cad1:
            turno = st.selectbox("Turno da Rota:", ["Manhã", "Tarde"])
        with col_cad2:
            whatsapp = st.text_input("WhatsApp do Responsável (DDD + Número):")

        col_h1, col_h2 = st.columns(2)
        with col_h1:
            horario_busca = st.text_input("⏰ Horário de Busca (ex: 06:40):", value="07:00")
        with col_h2:
            horario_escola = st.text_input("🏫 Horário Entrada/Saída Escola (ex: 07:15):", value="07:30")

        endereco_casa = st.text_input("🏡 Endereço da Residência:")
        escola = st.text_input("🏫 Nome da Escola:")
        endereco_escola = st.text_input("📍 Endereço da Escola:")
        email_mae = st.text_input("📧 E-mail do Responsável:")
        
        col_c1, col_c2 = st.columns(2)
        with col_c1:
            valor_mensalidade = st.number_input("Valor Mensalidade Padronizado (R$):", value=180.00, step=10.00)
        with col_c2:
            dia_vencimento = st.number_input("Dia Vencimento:", min_value=1, max_value=31, value=10)
        
        st.caption("ℹ️ *Aviso:* O contrato de transporte escolar é anual (dividido em 12 mensalidades de janeiro a dezembro).")
        
        cadastrar = st.form_submit_button("➕ Salvar na Nuvem")
        
        if cadastrar:
            if nome and endereco_casa and escola and email_mae:
                novo_aluno = {
                    "nome": nome,
                    "turno": turno,
                    "whatsapp": whatsapp,
                    "horario_busca": horario_busca,
                    "horario_escola": horario_escola,
                    "endereco_casa": endereco_casa,
                    "escola": escola,
                    "endereco_escola": endereco_escola,
                    "email_mae": email_mae,
                    "valor": valor_mensalidade,
                    "vencimento": dia_vencimento,
                    "gps_liberado": False,
                    "status_pagamento": "Pendente",
                    "vai_hoje": True,
                    "status": "Aguardando"
                }
                supabase.table("alunos").insert(novo_aluno).execute()
                st.success(f"Aluno **{nome}** cadastrado com valor padrão R$ {valor_mensalidade:.2f}!")
                st.rerun()

# ==========================================
# 4. ESPAÇO DOS PAIS
# ==========================================
else:
    st.subheader("👋 Espaço do Responsável")
    
    if not alunos:
        st.info("Nenhum aluno cadastrado no momento.")
    else:
        emails_maes = list(set([a["email_mae"] for a in alunos if "email_mae" in a]))
        if not emails_maes:
            st.info("Nenhum e-mail de responsável cadastrado.")
        else:
            email_selecionado = st.selectbox("Selecione seu e-mail cadastrado:", emails_maes)
            filho = next(a for a in alunos if a.get("email_mae") == email_selecionado)
            
            st.divider()
            st.markdown(f"### Aluno(a): **{filho['nome']}**")
            st.caption(f"Escola: {filho.get('escola', '')} | Turno: {filho.get('turno', 'Manhã')}")
            
            if filho.get("gps_liberado", False):
                st.success("📡 **Acompanhamento de GPS em Tempo Real Habilitado pela Tia Rafa**")
                
                coords_van = obter_coordenadas_van()
                lat_van = coords_van.get("latitude", -23.550520)
                lng_van = coords_van.get("longitude", -46.633308)
                
                mapa_html = f"""
                <iframe 
                    width="100%" 
                    height="280" 
                    frameborder="0" 
                    scrolling="no" 
                    marginheight="0" 
                    marginwidth="0" 
                    src="https://www.openstreetmap.org/export/embed.html?bbox={lng_van-0.01}%2C{lat_van-0.01}%2C{lng_van+0.01}%2C{lat_van+0.01}&amp;layer=mapnik&amp;marker={lat_van}%2C{lng_van}">
                </iframe>
                <br/><small><a href="https://www.openstreetmap.org/?mlat={lat_van}&amp;mlon={lng_van}#map=16/{lat_van}/{lng_van}" target="_blank">🔍 Ver no mapa ampliado</a></small>
                """
                components.html(mapa_html, height=310)
            else:
                st.warning("🛠️ **GPS em desenvolvimento**")

            st.divider()

            vai_hoje_atual = filho.get("vai_hoje", True)
            vai_hoje_input = st.toggle("Seu filho vai no transporte hoje?", value=vai_hoje_atual)
            
            if vai_hoje_input != vai_hoje_atual:
                novo_status = "Aguardando" if vai_hoje_input else "Ausente"
                supabase.table("alunos").update({"vai_hoje": vai_hoje_input, "status": novo_status}).eq("id", filho['id']).execute()
                st.toast("Status atualizado em tempo real!")
                st.rerun()
                
            st.markdown("#### Status da Viagem:")
            status_filho = filho.get("status", "Aguardando")
            if not filho.get("vai_hoje", True):
                st.error("Aviso enviado: A criança NÃO irá hoje.")
            elif status_filho == "Aguardando":
                st.warning("🕒 Aguardando busca na residência.")
            elif status_filho in ["Embarcou", "Na Rota", "Na Zafira", "Na Van"]:
                st.info("🚗 A caminho com a Tia Rafa!")
            elif status_filho in ["Desembarcou", "Entregue"]:
                st.success("✅ Entregue com segurança!")
                
            st.divider()
            
            st.markdown("#### 💳 Mensalidade:")
            status_pagamento_filho = filho.get("status_pagamento", "Pendente")
            forma_pag_filho = filho.get("forma_pagamento", "")
            valor_filho = filho.get("valor", 180.00)
            venc_filho = filho.get("vencimento", 10)
            
            if status_pagamento_filho == "Pago":
                st.success(f"✅ Mensalidade deste mês quitada ({forma_pag_filho})! Obrigado.")
            elif status_pagamento_filho == "Aguardando Aprovação":
                st.warning("🟡 Comprovante enviado! Aguardando conferência da Tia Rafa.")
            else:
                st.warning(f"⚠️ Mensalidade Pendente — R$ {valor_filho:.2f} (Vencimento: Dia {venc_filho})")
                
                opcao_pag = st.radio("Escolha a forma de pagamento:", ["🔑 PIX", "💵 Dinheiro em Mãos", "💳 Cartão de Crédito/Débito"])
                
                if opcao_pag == "🔑 PIX":
                    st.write("**Chave PIX (Copie e cole no app do banco):**")
                    st.code(CHAVE_PIX_TIA_RAFA, language="text")
                    
                    st.write("📤 **Enviar Comprovante do PIX:**")
                    foto_comprovante = st.file_uploader("Anexe o comprovante (Máx 5MB):", type=["png", "jpg", "jpeg", "pdf"])
                    
                    if foto_comprovante is not None:
                        if foto_comprovante.size > 5 * 1024 * 1024:
                            st.error("⚠️ O arquivo do comprovante deve ter no máximo 5MB.")
                        else:
                            if st.button("🚀 Enviar Comprovante PIX"):
                                bytes_data = foto_comprovante.getvalue()
                                mime_type = "application/pdf" if foto_comprovante.name.lower().endswith(".pdf") else "image/jpeg"
                                base64_img = f"data:{mime_type};base64,{base64.b64encode(bytes_data).decode('utf-8')}"
                                
                                supabase.table("alunos").update({
                                    "status_pagamento": "Aguardando Aprovação",
                                    "forma_pagamento": "PIX",
                                    "comprovante_url": base64_img
                                }).eq("id", filho['id']).execute()
                                
                                st.success("Comprovante enviado com sucesso!")
                                st.rerun()
                            
                elif opcao_pag == "💵 Dinheiro em Mãos":
                    st.info("O pagamento em dinheiro deve ser entregue diretamente à Tia Rafa no momento do embarque/desembarque.")
                    
                elif opcao_pag == "💳 Cartão de Crédito/Débito":
                    link_final_cartao = filho.get("link_pagamento_individual") or LINK_CARTAO_GERAL
                    
                    if link_final_cartao:
                        st.markdown(f"[💳 Clique aqui para pagar R$ {valor_filho:.2f} no cartão]({link_final_cartao})")
                    else:
                        st.info("O pagamento no cartão pode ser feito diretamente na maquininha com a Tia Rafa.")

            st.info(AVISO_ANUAL_TEXTO)

            hist_filho = obter_historico_aluno(filho["id"])
            if hist_filho:
                with st.expander("📜 Histórico de Mensalidades Anteriores"):
                    for h in hist_filho:
                        st.write(f"• **{h['mes_ano']}**: {h['status_pagamento']} (R$ {h['valor']:.2f})")
