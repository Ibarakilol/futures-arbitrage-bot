from typing import Union
import asyncio
import time

from aiogram import Bot

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, MAIN_ASSET, FUTURES_MIN_SPREAD
from exchanges import binance, bybit, kucoin, huobi

bot = Bot(token=TELEGRAM_BOT_TOKEN)

symbols_data: dict[str, dict[str, float]] = {}


def get_futures_trade_link(exchange: str, base_asset: str) -> Union[str, None]:
    if exchange == "binance":
        return binance.get_binance_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "bybit":
        return bybit.get_bybit_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "kucoin":
        return kucoin.get_kucoin_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "huobi":
        return huobi.get_huobi_futures_trade_link(base_asset, MAIN_ASSET)
    else:
        return None


def parse_funding_rates_data(
    funding_rates_data: dict[str, float], exchange_name: str
) -> None:
    for symbol, data in funding_rates_data.items():
        if MAIN_ASSET in symbol:
            if symbol in symbols_data:
                symbols_data[symbol].update({exchange_name: data})
            else:
                symbols_data[symbol] = {exchange_name: data}


def get_funding_rates_data() -> None:
    try:
        binance_funding_rates = binance.get_binance_funding_rates()
        bybit_funding_rates = bybit.get_bybit_funding_rates()
        kucoin_funding_rates = kucoin.get_kucoin_funding_rates()
        huobi_funding_rates = huobi.get_huobi_funding_rates()

        parse_funding_rates_data(binance_funding_rates, "binance")
        parse_funding_rates_data(bybit_funding_rates, "bybit")
        parse_funding_rates_data(kucoin_funding_rates, "kucoin")
        parse_funding_rates_data(huobi_funding_rates, "huobi")
    except Exception as ex:
        print(f"Ошибка получения данных фандинга. {ex}")


async def find_arbitrages() -> None:
    for symbol, data in symbols_data.items():
        if len(data.keys()) > 1:
            buy_exchange = ""
            buy_funding_rate = 0
            sell_exchange = ""
            sell_funding_rate = 0

            for exchange, funding_rate in data.items():
                if buy_funding_rate == 0 or funding_rate < buy_funding_rate:
                    buy_exchange = exchange
                    buy_funding_rate = funding_rate

                if sell_funding_rate == 0 or funding_rate > sell_funding_rate:
                    sell_exchange = exchange
                    sell_funding_rate = funding_rate

            if buy_exchange != sell_exchange and buy_funding_rate and sell_funding_rate:
                spread = 0

                if buy_funding_rate < 0 and sell_funding_rate > 0:
                    spread = buy_funding_rate + sell_funding_rate
                elif (buy_funding_rate > 0 and sell_funding_rate > 0) or (
                    buy_funding_rate < 0 and sell_funding_rate < 0
                ):
                    spread = buy_funding_rate - sell_funding_rate

                spread = abs(spread) - 0.2

                if spread >= FUTURES_MIN_SPREAD:
                    base_asset = symbol.split(MAIN_ASSET)[0]
                    message = f"Пара: {base_asset}/{MAIN_ASSET}, спред: {round(spread, 2)}%\n\n"
                    buy_message = f"Покупка(LONG) на {buy_exchange.capitalize()}\nТекущая ставка: {round(buy_funding_rate, 4)}%\n{get_futures_trade_link(buy_exchange, base_asset)}"
                    sell_message = f"Продажа(SHORT) на {sell_exchange.capitalize()}\nТекущая ставка: {round(sell_funding_rate, 4)}%\n{get_futures_trade_link(sell_exchange, base_asset)}"

                    full_message = f"{message}{buy_message}\n\n{sell_message}"

                    await bot.send_message(TELEGRAM_CHAT_ID, full_message)
                    print(full_message)


async def run() -> None:
    print(f"Минимальный спред: {FUTURES_MIN_SPREAD}%.\nМониторинг сделок...\n")

    while True:
        get_funding_rates_data()
        await find_arbitrages()
        time.sleep(10)


if __name__ == "__main__":
    asyncio.run(run())
