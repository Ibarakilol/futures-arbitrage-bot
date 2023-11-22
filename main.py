from typing import Union
import asyncio
import time

from aiogram import Bot

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, MAIN_ASSET, MIN_SPREAD
from exchanges import binance, bybit, kucoin, huobi, mexc, okx
from constants.funding_type import FUNDING_TYPE
from utils.format_funding_time import format_funding_time
from utils.get_current_time import get_current_time

bot = Bot(token=TELEGRAM_BOT_TOKEN)

symbols_data: dict[str, dict[str, dict[str, Union[str, float, int]]]] = {}


def parse_funding_rates_data(
    funding_rates_data: dict[str, dict[str, Union[str, float, int]]], exchange_name: str
) -> None:
    for symbol, data in funding_rates_data.items():
        if MAIN_ASSET in symbol:
            if symbol in symbols_data:
                symbols_data[symbol].update({exchange_name: data})
            else:
                symbols_data[symbol] = {exchange_name: data}


def get_futures_trade_link(exchange: str, base_asset: str) -> Union[str, None]:
    if exchange == "binance":
        return binance.get_binance_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "bybit":
        return bybit.get_bybit_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "kucoin":
        return kucoin.get_kucoin_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "huobi":
        return huobi.get_huobi_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "mexc":
        return mexc.get_mexc_futures_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "okx":
        return okx.get_okx_futures_trade_link(base_asset, MAIN_ASSET)
    else:
        return None


def get_spot_trade_link(exchange: str, base_asset: str) -> Union[str, None]:
    if exchange == "binance":
        return binance.get_binance_spot_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "bybit":
        return bybit.get_bybit_spot_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "kucoin":
        return kucoin.get_kucoin_spot_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "huobi":
        return huobi.get_huobi_spot_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "mexc":
        return mexc.get_mexc_spot_trade_link(base_asset, MAIN_ASSET)
    elif exchange == "okx":
        return okx.get_okx_spot_trade_link(base_asset, MAIN_ASSET)
    else:
        return None


def get_funding_rates_data() -> None:
    try:
        binance_funding_rates = binance.get_binance_funding_rates()
        bybit_funding_rates = bybit.get_bybit_funding_rates()
        kucoin_funding_rates = kucoin.get_kucoin_funding_rates()
        huobi_funding_rates = huobi.get_huobi_funding_rates()
        mexc_funding_rates = mexc.get_mexc_funding_rates()
        okx_funding_rates = okx.get_okx_funding_rates()

        parse_funding_rates_data(binance_funding_rates, "binance")
        parse_funding_rates_data(bybit_funding_rates, "bybit")
        parse_funding_rates_data(kucoin_funding_rates, "kucoin")
        parse_funding_rates_data(huobi_funding_rates, "huobi")
        parse_funding_rates_data(mexc_funding_rates, "mexc")
        parse_funding_rates_data(okx_funding_rates, "okx")
    except Exception as ex:
        print(f"Ошибка получения данных фандинга. {ex}")


async def find_arbitrages() -> None:
    for symbol, data in symbols_data.items():
        base_asset = symbol.split(MAIN_ASSET)[0]

        if len(data.keys()) > 1:
            rate_spread = 0
            rate_price_spread = 0

            best_index_price = 0
            best_index_price_exchange = ""

            buy_exchange = ""
            buy_funding_rate = 0
            buy_predicted_funding_rate = 0
            buy_next_funding_time = 0
            buy_mark_price = 0

            sell_exchange = ""
            sell_funding_rate = 0
            sell_predicted_funding_rate = 0
            sell_next_funding_time = 0
            sell_mark_price = 0

            for exchange, symbol_data in data.items():
                if (
                    buy_funding_rate == 0
                    or symbol_data["funding_rate"] < buy_funding_rate
                ):
                    buy_exchange = exchange
                    buy_funding_rate = symbol_data["funding_rate"]
                    buy_predicted_funding_rate = symbol_data["predicted_funding_rate"]
                    buy_next_funding_time = format_funding_time(
                        symbol_data["next_funding_time"]
                    )
                    buy_mark_price = symbol_data["mark_price"]

                if (
                    sell_funding_rate == 0
                    or symbol_data["funding_rate"] > sell_funding_rate
                ):
                    sell_exchange = exchange
                    sell_funding_rate = symbol_data["funding_rate"]
                    sell_predicted_funding_rate = symbol_data["predicted_funding_rate"]
                    sell_next_funding_time = format_funding_time(
                        symbol_data["next_funding_time"]
                    )
                    sell_mark_price = symbol_data["mark_price"]

                if (
                    best_index_price == 0
                    or symbol_data["index_price"] < best_index_price
                ):
                    best_index_price = symbol_data["index_price"]
                    best_index_price_exchange = exchange

            if buy_funding_rate < 0 and sell_funding_rate > 0:
                rate_spread = buy_funding_rate + sell_funding_rate
            elif (buy_funding_rate > 0 and sell_funding_rate > 0) or (
                buy_funding_rate < 0 and sell_funding_rate < 0
            ):
                rate_spread = buy_funding_rate - sell_funding_rate

            rate_spread = abs(rate_spread)

            if rate_spread >= MIN_SPREAD and buy_exchange != sell_exchange:
                if sell_mark_price and buy_mark_price:
                    rate_price_spread = round(
                        (sell_mark_price / buy_mark_price - 1) * 100, 2
                    )

                message = f"Пара: {base_asset}/{MAIN_ASSET}\n\n"
                buy_message = f"Покупка(LONG) на {buy_exchange.capitalize()}\nТекущая ставка: {round(buy_funding_rate, 4)}% ({FUNDING_TYPE[buy_exchange]})\nПрогнозная ставка: {buy_predicted_funding_rate}%\nСледующая выплата: {buy_next_funding_time}\n{get_futures_trade_link(buy_exchange, base_asset)}\n\n"
                sell_message = f"Продажа(SHORT) на {sell_exchange.capitalize()}\nТекущая ставка: {round(sell_funding_rate, 4)}% ({FUNDING_TYPE[sell_exchange]})\nПрогнозная ставка: {sell_predicted_funding_rate}%\nСледующая выплата: {sell_next_funding_time}\n{get_futures_trade_link(sell_exchange, base_asset)}\n\n"
                spread_message = f"Спред: {round(rate_spread, 2)}%, курсовой спред: {rate_price_spread}%"

                full_message = f"{message}{buy_message}{sell_message}{spread_message}"

                await bot.send_message(TELEGRAM_CHAT_ID, full_message)
                print(full_message)
            elif sell_funding_rate >= MIN_SPREAD:
                if sell_mark_price and best_index_price:
                    rate_price_spread = round(
                        (sell_mark_price / best_index_price - 1) * 100, 2
                    )

                message = f"Пара: {base_asset}/{MAIN_ASSET}\n\n"
                buy_message = f"Покупка(LONG) на {best_index_price_exchange.capitalize()}\n{get_spot_trade_link(best_index_price_exchange, base_asset)}\n\n"
                sell_message = f"Продажа(SHORT) на {sell_exchange.capitalize()}\nТекущая ставка: {round(sell_funding_rate, 4)}% ({FUNDING_TYPE[sell_exchange]})\nПрогнозная ставка: {sell_predicted_funding_rate}%\nСледующая выплата: {sell_next_funding_time}\n{get_futures_trade_link(sell_exchange, base_asset)}\n\n"
                spread_message = f"Курсовой спред: {rate_price_spread}%"

                full_message = f"{message}{buy_message}{sell_message}{spread_message}"

                await bot.send_message(TELEGRAM_CHAT_ID, full_message)
                print(full_message)


async def run() -> None:
    print(f"Минимальный спред: {MIN_SPREAD}%")

    while True:
        print(f"{get_current_time()} Поиск спредов...\n")
        get_funding_rates_data()
        await find_arbitrages()
        print(f"{get_current_time()} Следующая итерация через 60 секунд...\n")
        time.sleep(60)


if __name__ == "__main__":
    asyncio.run(run())
