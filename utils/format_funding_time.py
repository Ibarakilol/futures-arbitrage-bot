from datetime import datetime


def format_funding_time(funding_time: float) -> str:
    return datetime.fromtimestamp(funding_time / 1000).strftime("%H:%M")
