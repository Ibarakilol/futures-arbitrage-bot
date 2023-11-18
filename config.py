import os

from dotenv import load_dotenv

load_dotenv()

MAIN_ASSET = "USDT"
MIN_SPREAD = 0.4

TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
