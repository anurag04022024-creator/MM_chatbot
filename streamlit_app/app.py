"""Main Streamlit Application — NOVA (Claude AI Aesthetic).

Provides a modern, refined, multimodal conversational interface:
- Name: NOVA
- Aesthetic: Claude AI (warm editorial palette, terracotta accents, Newsreader typography)
- Multimodal: Text, image analysis, audio transcription
- Knowledge Base: RAG citation inspector and document ingestion
- Ethical Safety: Crisis interception and tri-state safety classification
"""

import uuid
import streamlit as st
from streamlit_app.api_client import APIClient
from streamlit_app.components.chat_view import render_chat_history
from streamlit_app.components.file_uploader import render_multimodal_uploader
from streamlit_app.components.rag_inspector import render_rag_tab
from streamlit_app.styles import CLAUDE_CSS

# Page configuration
st.set_page_config(
    page_title="NOVA",
    page_icon="✦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Inject Claude AI CSS theme
st.markdown(CLAUDE_CSS, unsafe_allow_html=True)

# Initialize API Client
api_client = APIClient()

# Initialize Session State
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())

if "messages" not in st.session_state:
    st.session_state.messages = []

if "uploaded_img_id" not in st.session_state:
    st.session_state.uploaded_img_id = None

if "uploaded_audio_id" not in st.session_state:
    st.session_state.uploaded_audio_id = None

if "preset_prompt" not in st.session_state:
    st.session_state.preset_prompt = None


# --- SIDEBAR: Claude-Styled Workspace & Controls ---
with st.sidebar:
    st.markdown(
        """
        <div class="nova-brand">
            <div class="nova-starburst">✦</div>
            <span>NOVA</span>
        </div>
        <div style="font-size: 0.85rem; color: #78736B; margin-top: 4px; margin-bottom: 12px;">
            Intelligent Multimodal Assistant
        </div>
        """,
        unsafe_allow_html=True,
    )

    if st.button("✦ Start New Chat", use_container_width=True, type="primary"):
        st.session_state.session_id = str(uuid.uuid4())
        st.session_state.messages = []
        st.session_state.uploaded_img_id = None
        st.session_state.uploaded_audio_id = None
        st.session_state.preset_prompt = None
        st.rerun()

    st.divider()

    # System Status Card
    st.markdown("#### System & Model")
    try:
        health = api_client.check_health()
        provider = health.get("llm_provider", "gemini").title()
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border: 1px solid #E5E2DA; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;">
                <div style="font-size: 0.85rem; font-weight: 600; color: #2C2926; display: flex; align-items: center; gap: 6px;">
                    <span style="color: #2E7D32;">●</span> Connected
                </div>
                <div style="font-size: 0.8rem; color: #6E6962; margin-top: 4px;">
                    • <b>Core Model</b>: Gemini 2.5 Flash<br>
                    • <b>Provider</b>: {provider}<br>
                    • <b>Storage</b>: SQLite + In-Memory RAG
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    except Exception:
        st.error("🔴 Backend Disconnected")
        st.caption("Ensure FastAPI backend is running on `http://localhost:8000`.")

    st.markdown(f"<div style='font-size: 0.75rem; color: #8C867E;'>Session ID: <code>{st.session_state.session_id[:8]}...</code></div>", unsafe_allow_html=True)

    st.divider()

    # Crisis & Safety Card
    st.markdown(
        """
        <div style="background: #FAF8F5; border: 1px solid #EAE6DE; border-radius: 10px; padding: 12px; font-size: 0.82rem; color: #59554E; line-height: 1.45;">
            <div style="font-weight: 600; color: #B85D41; margin-bottom: 6px;">⚠️ Immediate Support Notice</div>
            If you or someone you know is in acute distress or crisis:<br>
            • <b>US/CA</b>: Call or text <b>988</b><br>
            • <b>UK</b>: Call <b>111</b> or <b>116 123</b><br>
            • <b>Global</b>: <a href="https://findahelpline.com" target="_blank" style="color: #CC785C;">findahelpline.com</a><br>
            • <b>Emergency</b>: Call <b>911 / 999 / 112</b><br><br>
            <i>NOVA provides emotional support and intelligent assistance but does not replace medical or clinical mental health treatment.</i>
        </div>
        """,
        unsafe_allow_html=True,
    )


# --- MAIN TABS ---
tab_chat, tab_media, tab_rag, tab_safety = st.tabs([
    "✦ Chat with NOVA",
    "📎 Attachments & Media",
    "📚 Knowledge Base (RAG)",
    "🛡️ Safety Architecture",
])


# --- TAB 1: Chat Interface ---
with tab_chat:
    # Top banner for staged multimodal attachments
    active_attachments = []
    if st.session_state.get("uploaded_img_id"):
        active_attachments.append(f"🖼️ Image (`{st.session_state.uploaded_img_id[:8]}...`)")
    if st.session_state.get("uploaded_audio_id"):
        active_attachments.append(f"🎙️ Audio (`{st.session_state.uploaded_audio_id[:8]}...`)")

    if active_attachments:
        col_banner, col_btn = st.columns([4, 1])
        with col_banner:
            st.info(f"Staged Attachments ready for next prompt: **{' + '.join(active_attachments)}**")
        with col_btn:
            if st.button("Clear Attachments", key="clear_attachments_btn", use_container_width=True):
                st.session_state.uploaded_img_id = None
                st.session_state.uploaded_audio_id = None
                st.rerun()

    # Render Conversation History or Claude Hero
    render_chat_history(st.session_state.messages)

    # Secondary Controls: Grounding Checkbox
    col_tools_left, col_tools_right = st.columns([3, 1])
    with col_tools_left:
        use_rag = st.checkbox(
            "Ground responses in Knowledge Base (RAG)",
            value=True,
            help="Consults verified wellness literature and documents for grounded facts and coping strategies.",
        )

    # Process prompt from input bar or from Claude preset cards
    incoming_prompt = None
    if st.session_state.get("preset_prompt"):
        incoming_prompt = st.session_state.preset_prompt
        st.session_state.preset_prompt = None

    user_input = st.chat_input("Message NOVA...")
    if user_input:
        incoming_prompt = user_input

    if incoming_prompt:
        # Append User Message to State
        st.session_state.messages.append({"role": "user", "content": incoming_prompt})

        with st.chat_message("user", avatar="👤"):
            st.markdown(incoming_prompt)

        # Call FastAPI backend
        with st.chat_message("assistant", avatar="✦"):
            with st.spinner("NOVA is thinking..."):
                try:
                    response = api_client.send_chat(
                        session_id=st.session_state.session_id,
                        message=incoming_prompt,
                        image_file_id=st.session_state.get("uploaded_img_id"),
                        audio_file_id=st.session_state.get("uploaded_audio_id"),
                        use_rag=use_rag,
                    )

                    # Reset staged media after successful delivery
                    st.session_state.uploaded_img_id = None
                    st.session_state.uploaded_audio_id = None

                    # Store assistant message
                    asst_msg = {
                        "role": "assistant",
                        "content": response.get("content", ""),
                        "metadata": {
                            "safety_tier": response.get("safety_tier"),
                            "sources": response.get("sources", []),
                        },
                    }
                    st.session_state.messages.append(asst_msg)
                    st.rerun()

                except Exception as exc:
                    st.error(f"Error communicating with NOVA backend: {exc}")


# --- TAB 2: Multimodal Attachments ---
with tab_media:
    img_id, audio_id, _ = render_multimodal_uploader(api_client)
    if img_id or audio_id:
        st.success("Media successfully processed and attached! Return to '✦ Chat with NOVA' to send your prompt with this media.")


# --- TAB 3: Knowledge Base (RAG) ---
with tab_rag:
    render_rag_tab(api_client)


# --- TAB 4: Safety & Ethical Architecture ---
with tab_safety:
    st.markdown(
        """
        <h2 class="claude-serif">🛡️ NOVA Ethical & Safety Architecture</h2>
        <p style="color: #6E6962;">Comprehensive multi-tier guardrails engineered for user well-being and reliability.</p>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("""
    ### 1. Tri-State Safety Classification Layer
    Every incoming message is evaluated prior to model generation:
    - **SAFE**: Open intellectual discussion across programming, science, writing, learning, and general wellness.
    - **SENSITIVE**: Expressions of sadness, emotional strain, or stress. Activates heightened non-judgmental active listening.
    - **HIGH_RISK**: Expressions of suicide, self-harm, or severe distress.
      - **Crisis Interception**: LLM generation is bypassed; deterministic, vetted crisis support and helplines are delivered immediately.

    ### 2. Prompt-Injection & Boundary Defense
    - Retrieved documents and user attachments are encapsulated within strict `<PASSIVE_DATA>` delimiters.
    - NOVA's core system guidelines strictly override any external instructional prompts contained within files.

    ### 3. Non-Clinical Ethical Boundaries
    - **Identity Transparency**: NOVA always identifies as an AI assistant and never claims human consciousness or physical existence.
    - **No Clinical Diagnoses**: NOVA never diagnoses psychological, psychiatric, or physical medical illnesses.
    - **No Pharmaceutical Prescriptions**: NOVA will never prescribe, recommend, or alter medication dosages.
    """)
