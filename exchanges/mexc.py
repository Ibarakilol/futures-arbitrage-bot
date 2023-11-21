from typing import Union

import requests


def get_mexc_spot_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.mexc.com/ru-RU/exchange/{currency1}_{currency2}"


def get_mexc_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://futures.mexc.com/exchange/{currency1}_{currency2}"


def get_mexc_funding_rates() -> dict[str, dict[str, Union[str, int, float]]]:
    contracts = requests.get("https://contract.mexc.com/api/v1/contract/detail")

    symbols = [
        contract["symbol"]
        for contract in contracts.json()["data"]
        if contract["symbol"].split("_")[1] == "USDT"
    ]

    funding_rates = {}
    for symbol in symbols:
        funding_rate = requests.get(
            f"https://contract.mexc.com/api/v1/contract/funding_rate/{symbol}"
        )
        funding_rate_data = funding_rate.json()["data"]

        funding_rates["".join(symbol.split("_"))] = {
            "funding_rate": float(funding_rate_data["fundingRate"]) * 100,
            "index_price": 0,
            "mark_price": 0,
            "next_funding_time": int(funding_rate_data["nextSettleTime"]),
            "predicted_funding_rate": "-",
        }

    return funding_rates
