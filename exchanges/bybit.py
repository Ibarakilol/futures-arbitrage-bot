import requests


def get_bybit_spot_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.bybit.com/ru-RU/trade/spot/{currency1}/{currency2}"


def get_bybit_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.bybit.com/trade/usdt/{currency1}{currency2}"


def get_bybit_funding_rates() -> dict[str, dict[str, float]]:
    funding_rates = requests.get(
        "https://api.bybit.com/derivatives/v3/public/tickers?category=linear"
    )

    return {
        funding_rate["symbol"]: {
            "funding_rate": float(funding_rate["fundingRate"]) * 100,
            "index_price": float(funding_rate["indexPrice"]),
            "mark_price": float(funding_rate["markPrice"]),
            "next_funding_time": float(funding_rate["nextFundingTime"]),
            "predicted_funding_rate": "-",
        }
        for funding_rate in funding_rates.json()["result"]["list"]
        if "-" not in funding_rate["symbol"]
    }
