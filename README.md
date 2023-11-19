# Futures Arbitrage Bot

Telegram бот по поиску арбитражных сделок на фьючерсах.

## Установка

1. Клонирование репозитория

```
$ git clone https://github.com/Ibarakilol/futures-arbitrage-bot.git
$ cd futures-arbitrage-bot
```

2. Установка зависимостей

```
$ pip install requests python-dotenv aiogram
```

3. Переименовать файл `.env.example` в `.env` и заполнить переменные TELEGRAM_CHAT_ID и TELEGRAM_BOT_TOKEN
4. Запуск

```
$ python main.py
```

## Описание

В боте добавлены 4 биржи (Binance, Bybit, Kucoin, Huobi), на каждой из них бот сканирует процентную ставку по компенсации фьючерсов, сравнивает с другими для поиска большего спреда, и дает указания где и в какую позицию заходить (заходить нужно одновременно и лучше не более чем с х5 плечом). Помимо фьючерсного арбитража существует арбитраж между спотом и фьючерсом. Если у контракта положительная ставка финансирования, то можно купить монету на споте и встать в шорт на фьючерсе. В таком случае будет начисляться ставка с шортовой позиции и не возникнет риска от изменения курса, т.к. количество проданных монет на фьючерсе равно количеству купленных монет на споте.

Компенсация выплачивается каждые 8 часов: у Binance, Bybit, Huobi это 03:00, 11:00, 19:00, у Kucoin это 07:00, 15:00, 23:00 по МСК и нужно иметь открытую позицию во время её начисление. Если ставка превышает лимиты биржи, то биржа может сокращать это время до 4 часов.

Есть фиксируемая и есть плавающая ставка, в фиксируемой закрепляется ставка по выплате на протяжении всего периода (8 часов), у плавающей ставкая изменяется постоянно поэтому, нужно периодически проверять их. У Kucoin, Huobi фиксируемая, у Binance, Bybit плавающая.

Нюансы по торговле:

1. Если рынок слишком волатилен, лучше поставить TP/SL чуть выше цены ликвидации, по направлению движения курса.
2. Если ставка положительная и слишком далеко ушла от цены спота (на нeпoпyляpных биржах), то лучше заходить небольшой суммой, либо пропустить.
3. Если есть большое курсовое расхождение (цены фьючерсов) или курсовой спред больше спреда ставок, то лучше заходить небольшой суммой, либо пропустить.
4. Если по уже открытым позициям расхождение цены > 5%, то сократить или закрыть позицию.

**Видео с инструкцией и примерами:**
[Видео 1](https://www.youtube.com/watch?v=NfWbw5UaD2o) |
[Видео 2](https://youtu.be/ZjcFk0bDGlk)
