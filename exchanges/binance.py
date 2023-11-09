import requests


def get_binance_futures_trade_link(currency1: str, currency2: str) -> str:
    return f"https://www.binance.com/ru/futures/{currency1}{currency2}"


def get_binance_withdrawal_link(currency: str, is_deposit: bool) -> str:
    if is_deposit:
        return f"https://www.binance.com/ru/my/wallet/account/main/deposit/crypto/{currency}"
    else:
        return f"https://www.binance.com/ru/my/wallet/account/main/withdrawal/crypto/{currency}"


def get_binance_funding_rates() -> dict[str, float]:
    funding_rates = requests.get("https://fapi.binance.com/fapi/v1/premiumIndex")

    return {
        funding_rate["symbol"]: float(funding_rate["lastFundingRate"]) * 100
        for funding_rate in funding_rates.json()
    }
