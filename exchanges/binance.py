import requests


def get_binance_spot_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.binance.com/ru/trade/{currency1}_{currency2}?type=spot"


def get_binance_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.binance.com/ru/futures/{currency1}{currency2}"


def get_binance_funding_rates() -> dict[str, dict[str, float]]:
    funding_rates = requests.get("https://fapi.binance.com/fapi/v1/premiumIndex")

    return {
        funding_rate["symbol"]: {
            "funding_rate": float(funding_rate["lastFundingRate"]) * 100,
            "index_price": float(funding_rate["indexPrice"]),
            "mark_price": float(funding_rate["markPrice"]),
            "next_funding_time": funding_rate["nextFundingTime"],
            "predicted_funding_rate": "-",
        }
        for funding_rate in funding_rates.json()
    }
