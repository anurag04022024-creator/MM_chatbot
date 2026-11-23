"""Chat Transcript and Message View Component for Streamlit (Claude AI Styled)."""

from typing import List, Dict, Any, Callable, Optional
import streamlit as st
from streamlit_app.styles import get_greeting


def render_claude_hero(on_prompt_select: Optional[Callable[[str], None]] = None) -> None:
    """Renders Claude's iconic centered hero screen when chat is empty."""
    greeting = get_greeting()

    st.markdown(
        f"""
        <div class="claude-hero-container">
            <div class="claude-hero-glyph">✦</div>
            <div class="claude-hero-title">{greeting}</div>
            <div class="claude-hero-subtitle">
                How can <b>NOVA</b> help you today? Ask anything from technical code & architecture to grounded wellness research and thoughtful conversation.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 4 Quick Prompt Cards (Claude Style)
    col1, col2 = st.columns(2)

    with col1:
        if st.button(
            "🐍 Python Loops & Syntax\n\nShow me Python loop patterns with best-practice examples",
            use_container_width=True,
            key="prompt_card_1",
        ):
            st.session_state.preset_prompt = "loop code of python with examples"
            st.rerun()

        if st.button(
            "🌿 Mindfulness & Grounding\n\nGuide me through a gentle 5-4-3-2-1 grounding exercise",
            use_container_width=True,
            key="prompt_card_2",
        ):
            st.session_state.preset_prompt = "Guide me through a gentle 5-4-3-2-1 grounding exercise for stress relief."
            st.rerun()

    with col2:
        if st.button(
            "📚 Knowledge Base Research\n\nWhat coping strategies are documented in our knowledge base?",
            use_container_width=True,
            key="prompt_card_3",
        ):
            st.session_state.preset_prompt = "What coping strategies and stress-management techniques are in the knowledge base?"
            st.rerun()

        if st.button(
            "✨ Creative & Clear Writing\n\nHelp me draft a thoughtful, supportive message",
            use_container_width=True,
            key="prompt_card_4",
        ):
            st.session_state.preset_prompt = "Help me draft a warm, articulate, and empathetic message to check in on a colleague."
            st.rerun()


def render_message(msg: Dict[str, Any]) -> None:
    """Renders a single message bubble with Claude aesthetic."""
    role = msg.get("role", "user")
    content = msg.get("content", "")
    metadata = msg.get("metadata", {}) or {}
    safety_tier = metadata.get("safety_tier")
    sources = metadata.get("sources", [])

    # Claude styling: Assistant uses '✦', User uses '👤'
    avatar = "✦" if role == "assistant" else "👤"

    with st.chat_message(role, avatar=avatar):
        if role == "assistant":
            st.markdown(f"**NOVA** <span class='nova-badge'>Assistant</span>", unsafe_allow_html=True)

        st.markdown(content)

        # Show safety indicator badge for assistant messages
        if role == "assistant" and safety_tier:
            if safety_tier == "high_risk":
                st.error("🛡️ Crisis Safety Interception Triggered — Helplines Provided")
            elif safety_tier == "sensitive":
                st.caption("💙 *Active empathetic listening mode engaged*")

        # Show grounded RAG citations
        if role == "assistant" and sources:
            with st.expander(f"📚 Grounded Sources ({len(sources)} citations from Knowledge Base)"):
                for idx, src in enumerate(sources, 1):
                    doc_name = src.get("filename", "Unknown Document")
                    score = src.get("similarity_score", 0.0)
                    chunk_id = src.get("chunk_id", "")
                    snippet = src.get("content_snippet", "")

                    st.markdown(
                        f"**{idx}. {doc_name}** `[Score: {score:.2f}]` `[Chunk: {chunk_id}]`\n\n"
                        f"> *\"{snippet}\"*"
                    )


def render_chat_history(messages: List[Dict[str, Any]]) -> None:
    """Renders full conversation message list or the Claude hero when empty."""
    if not messages:
        render_claude_hero()
        return

    for msg in messages:
        render_message(msg)
