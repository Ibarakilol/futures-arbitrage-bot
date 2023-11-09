import requests


def get_bybit_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.bybit.com/trade/usdt/{currency1}{currency2}"


def get_bybit_withdrawal_link() -> str:
    return "https://www.bybit.com/user/assets/home/overview"


def get_bybit_funding_rates() -> dict[str, float]:
    funding_rates = requests.get(
        "https://api.bybit.com/derivatives/v3/public/tickers?category=linear"
    )

    return {
        funding_rate["symbol"]: float(funding_rate["fundingRate"]) * 100
        for funding_rate in funding_rates.json()["result"]["list"]
        if "-" not in funding_rate["symbol"]
    }
