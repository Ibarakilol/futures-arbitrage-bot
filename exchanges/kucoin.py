import time

import requests


def get_kucoin_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.kucoin.com/ru/futures/trade/{currency1}{currency2}M"


def get_kucoin_funding_rates() -> dict[str, dict[str, float]]:
    funding_rates = requests.get(
        "https://api-futures.kucoin.com/api/v1/contracts/active"
    )

    return {
        funding_rate["symbol"][:-1]: {
            "funding_rate": funding_rate["fundingFeeRate"] * 100,
            "index_price": funding_rate["indexPrice"],
            "mark_price": funding_rate["markPrice"],
            "next_funding_time": time.time() + funding_rate["nextFundingRateTime"],
            "predicted_funding_rate": funding_rate["predictedFundingFeeRate"] * 100,
        }
        for funding_rate in funding_rates.json()["data"]
        if funding_rate["fundingFeeRate"]
    }
