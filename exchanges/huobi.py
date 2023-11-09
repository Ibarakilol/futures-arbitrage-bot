import requests


def get_huobi_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.huobi.com/ru-ru/futures/linear_swap/exchange#contract_code={currency1}-{currency2}&contract_type=swap&type=isolated"


def get_huobi_withdrawal_link(currency: str, is_deposit: bool) -> str:
    if is_deposit:
        return f"https://www.huobi.com/ru-ru/finance/deposit/{currency.lower()}"
    else:
        return f"https://www.huobi.com/ru-ru/finance/withdraw/{currency.lower()}"


def get_huobi_funding_rates() -> dict[str, float]:
    funding_rates = requests.get(
        "https://api.hbdm.com/linear-swap-api/v1/swap_batch_funding_rate"
    )

    return {
        funding_rate["contract_code"].replace("-", ""): float(
            funding_rate["funding_rate"]
        )
        * 100
        for funding_rate in funding_rates.json()["data"]
        if funding_rate["funding_rate"]
    }
