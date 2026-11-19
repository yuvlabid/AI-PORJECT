# RecallForge — Streamlit Edition

Run locally or deploy on Streamlit Community Cloud without exposing any API keys in the browser.

## Setup

```bash
cd streamlit
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set `GEMINI_API_KEY` on the server (either via environment variable or `.streamlit/secrets.toml`):

```toml
# .streamlit/secrets.toml (do not commit)
GEMINI_API_KEY = "your-server-gemini-api-key"
```

## Run

```bash
streamlit run app.py
```
