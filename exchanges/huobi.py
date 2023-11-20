from typing import Union

import requests


def get_huobi_spot_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.htx.com/ru-ru/trade/{currency1.lower()}_{currency2.lower()}?type=spot"


def get_huobi_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.huobi.com/ru-ru/futures/linear_swap/exchange#contract_code={currency1}-{currency2}&contract_type=swap&type=isolated"


def get_huobi_funding_rates() -> dict[str, dict[str, Union[int, float]]]:
    funding_rates = requests.get(
        "https://api.hbdm.com/linear-swap-api/v1/swap_batch_funding_rate"
    )
    index_prices = requests.get("https://api.hbdm.com/linear-swap-api/v1/swap_index")
    mark_prices = requests.get(
        "https://api.hbdm.com/linear-swap-ex/market/detail/batch_merged"
    )

    return {
        funding_rate["contract_code"].replace("-", ""): {
            "funding_rate": float(funding_rate["funding_rate"]) * 100,
            "index_price": next(
                float(index_price["index_price"])
                for index_price in index_prices.json()["data"]
                if index_price["contract_code"] == funding_rate["contract_code"]
            ),
            "mark_price": next(
                float(mark_price["close"])
                for mark_price in mark_prices.json()["ticks"]
                if mark_price["contract_code"] == funding_rate["contract_code"]
            ),
            "next_funding_time": int(funding_rate["funding_time"]),
            "predicted_funding_rate": float(funding_rate["estimated_rate"]) * 100,
        }
        for funding_rate in funding_rates.json()["data"]
        if funding_rate["funding_rate"]
    }
