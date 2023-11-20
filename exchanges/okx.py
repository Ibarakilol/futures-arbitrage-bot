from typing import Union

import requests


def get_okx_spot_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.okx.com/ru/trade-spot/{currency1.lower()}-{currency2.lower()}"


def get_okx_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.okx.com/ru/trade-swap/{currency1.lower()}-{currency2.lower()}-swap"


def get_okx_funding_rates() -> dict[str, dict[str, Union[int, float]]]:
    instruments = requests.get(
        "https://www.okx.com/api/v5/public/instruments?instType=SWAP"
    )
    index_prices = requests.get(
        "https://www.okx.com/api/v5/market/index-tickers?quoteCcy=USDT"
    )
    mark_prices = requests.get(
        "https://www.okx.com/api/v5/public/mark-price?instType=SWAP"
    )

    instrument_ids = [
        instrument["instId"]
        for instrument in instruments.json()["data"]
        if instrument["instId"].split("-")[1] == "USDT"
    ]

    funding_rates = {}
    for instrument_id in instrument_ids:
        funding_rate = requests.get(
            f"https://www.okx.com/api/v5/public/funding-rate?instId={instrument_id}"
        )
        funding_rate_data = funding_rate.json()["data"][0]

        funding_rates["".join(instrument_id.split("-")[:-1])] = {
            "funding_rate": float(funding_rate_data["fundingRate"]) * 100,
            "index_price": next(
                float(index_price["idxPx"])
                for index_price in index_prices.json()["data"]
                if index_price["instId"] == "-".join(instrument_id.split("-")[:-1])
            ),
            "mark_price": next(
                float(mark_price["markPx"])
                for mark_price in mark_prices.json()["data"]
                if mark_price["instId"] == instrument_id
            ),
            "next_funding_time": int(funding_rate_data["nextFundingTime"]),
            "predicted_funding_rate": float(funding_rate_data["nextFundingRate"]) * 100,
        }

    return funding_rates
