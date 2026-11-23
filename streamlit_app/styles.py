"""Claude AI styling system for NOVA.

Provides CSS injection and helper layouts mimicking Claude's warm, elegant,
literary, and minimalist aesthetic.
"""

CLAUDE_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* Global Font & Theme Application */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #2C2926;
    background-color: #FAF9F5;
}

/* Warm Editorial Claude Headings */
h1, h2, h3, .claude-serif {
    font-family: 'Newsreader', Georgia, 'Times New Roman', serif !important;
    font-weight: 500 !important;
    letter-spacing: -0.02em !important;
    color: #242220 !important;
}

/* Main Container max-width & spacing */
.main .block-container {
    max-width: 900px !important;
    padding-top: 1.8rem !important;
    padding-bottom: 3.5rem !important;
}

/* Claude Sidebar Styling */
[data-testid="stSidebar"] {
    background-color: #F3F1EC !important;
    border-right: 1px solid #E5E2DA !important;
}

[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] h1 {
    font-size: 1.6rem !important;
    font-family: 'Newsreader', serif !important;
    margin-bottom: 0.2rem !important;
}

/* Claude Brand Mark Badge */
.nova-brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Newsreader', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #242220;
}

.nova-starburst {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: #CC785C;
    color: #FFFFFF;
    font-size: 1rem;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(204, 120, 92, 0.3);
}

.nova-badge {
    background: #F4E8E2;
    color: #B85D41;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 12px;
    border: 1px solid #ECD3C8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Claude Empty State / Hero Container */
.claude-hero-container {
    text-align: center;
    padding: 2.5rem 1rem 1.5rem 1rem;
    max-width: 680px;
    margin: 0 auto;
}

.claude-hero-glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    border-radius: 14px;
    background: linear-gradient(135deg, #D97E63 0%, #CC785C 100%);
    color: white;
    font-size: 1.8rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 12px rgba(204, 120, 92, 0.25);
}

.claude-hero-title {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 2.2rem;
    font-weight: 500;
    color: #242220;
    margin-bottom: 0.6rem;
    line-height: 1.25;
}

.claude-hero-subtitle {
    font-size: 1.05rem;
    color: #6E6962;
    margin-bottom: 2rem;
    line-height: 1.5;
}

/* Claude Action Cards Grid */
.claude-card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 1.5rem;
    text-align: left;
}

.claude-card {
    background: #FFFFFF;
    border: 1px solid #E5E2DA;
    border-radius: 14px;
    padding: 16px 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.claude-card:hover {
    border-color: #CC785C;
    box-shadow: 0 4px 12px rgba(204, 120, 92, 0.12);
    transform: translateY(-2px);
}

.claude-card-title {
    font-size: 0.92rem;
    font-weight: 600;
    color: #242220;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.claude-card-desc {
    font-size: 0.82rem;
    color: #78736B;
    line-height: 1.35;
}

/* Claude Chat Message Containers */
[data-testid="stChatMessage"] {
    background-color: transparent !important;
    padding: 1.1rem 0 !important;
    border-bottom: 1px solid #F0ECE4 !important;
}

/* Avatar styling */
[data-testid="stChatMessage"] [data-testid="stChatMessageAvatarCustom"] {
    background-color: #CC785C !important;
    color: white !important;
}

/* Claude Style Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    border-bottom: 1px solid #E5E2DA;
    padding-bottom: 4px;
}

.stTabs [data-baseweb="tab"] {
    border-radius: 8px 8px 0 0;
    padding: 8px 16px;
    font-weight: 500;
    color: #6E6962;
    background-color: transparent;
    border: none !important;
    font-size: 0.95rem;
}

.stTabs [aria-selected="true"] {
    color: #CC785C !important;
    font-weight: 600 !important;
    border-bottom: 2px solid #CC785C !important;
}

/* Claude Style Buttons */
button[kind="primary"] {
    background-color: #CC785C !important;
    border-color: #CC785C !important;
    color: #FFFFFF !important;
    border-radius: 12px !important;
    font-weight: 500 !important;
    transition: all 0.2s ease;
}

button[kind="primary"]:hover {
    background-color: #B86347 !important;
    border-color: #B86347 !important;
    box-shadow: 0 2px 8px rgba(204, 120, 92, 0.3) !important;
}

button[kind="secondary"] {
    background-color: #FFFFFF !important;
    border: 1px solid #DCD8CF !important;
    color: #2C2926 !important;
    border-radius: 12px !important;
    font-weight: 500 !important;
}

button[kind="secondary"]:hover {
    border-color: #CC785C !important;
    color: #CC785C !important;
    background-color: #FAF8F5 !important;
}

/* Claude Floating Chat Input Bar */
[data-testid="stChatInput"] {
    border-radius: 20px !important;
    border: 1px solid #D6D2C7 !important;
    background-color: #FFFFFF !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
    transition: all 0.2s ease !important;
}

[data-testid="stChatInput"]:focus-within {
    border-color: #CC785C !important;
    box-shadow: 0 0 0 2px rgba(204, 120, 92, 0.2), 0 4px 12px rgba(0, 0, 0, 0.06) !important;
}

/* Citation / Expander Styling */
.streamlit-expanderHeader {
    background-color: #FAF8F5 !important;
    border: 1px solid #E8E5DD !important;
    border-radius: 10px !important;
    font-size: 0.88rem !important;
    color: #59554E !important;
}

/* Code Blocks in Chat */
code {
    font-family: 'JetBrains Mono', Consolas, monospace !important;
    font-size: 0.88em !important;
    background-color: #F2EFE9 !important;
    color: #8C4328 !important;
    padding: 2px 6px !important;
    border-radius: 5px !important;
}

pre {
    background-color: #242220 !important;
    border-radius: 10px !important;
    border: 1px solid #383531 !important;
}

pre code {
    background-color: transparent !important;
    color: #EDEBE6 !important;
    padding: 0 !important;
}

/* Custom Scrollbars */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-thumb {
    background: #D8D4CA;
    border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
    background: #B8B3A8;
}
</style>
"""


def get_greeting() -> str:
    """Returns a warm time-appropriate greeting like Claude."""
    import datetime
    hour = datetime.datetime.now().hour
    if 5 <= hour < 12:
        return "Good morning"
    elif 12 <= hour < 17:
        return "Good afternoon"
    else:
        return "Good evening"
