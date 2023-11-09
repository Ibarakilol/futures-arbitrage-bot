import requests


def get_kucoin_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.kucoin.com/ru/futures/trade/{currency1}{currency2}M"


def get_kucoin_withdrawal_link(currency: str, is_deposit: bool) -> str:
    if is_deposit:
        return f"https://www.kucoin.com/ru/assets/coin/{currency}"
    else:
        return f"https://www.kucoin.com/ru/assets/withdraw/{currency}"


def get_kucoin_funding_rates() -> dict[str, float]:
    funding_rates = requests.get(
        "https://api-futures.kucoin.com/api/v1/contracts/active"
    )

    return {
        funding_rate["symbol"][:-1]: float(funding_rate["fundingFeeRate"]) * 100
        for funding_rate in funding_rates.json()["data"]
        if funding_rate["fundingFeeRate"]
    }
