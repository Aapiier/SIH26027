import sys
from pathlib import Path

# Add project root to sys.path so backend and dataset_generation can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.main import app

# Vercel serverless ASGI entrypoint
# The 'app' object is automatically recognized by @vercel/python
