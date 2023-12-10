require('dotenv').config();
const { Telegraf, Extra } = require('telegraf');

const { mapArbitrageToButton } = require('./adapters');
const { EXCHANGE_NAME, FUNDING_TYPE } = require('./constants');
const { getFundingRates } = require('./exchanges');
const { getTimeString, sleep } = require('./utils');

// 'binance', 'bybit', 'kucoin', 'mexc!', 'huobi', 'okx', 'coinex!'
const EXCHANGES = ['binance', 'bybit', 'kucoin', 'huobi'];
const MIN_SPREAD = 0.4;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.telegram.setMyCommands([
  {
    command: 'spreads',
    description: 'Список спредов',
  },
  {
    command: 'spot_futures',
    description: 'Спот-фьючерс',
  },
]);

let futuresArbitrages = [];
let spotFuturesArbitrages = [];

async function parseFundingRatesData() {
  const symbolsData = {};

  for await (const exchange of EXCHANGES) {
    try {
      const fundingRatesData = await getFundingRates(exchange);

      Object.entries(fundingRatesData).forEach(([symbol, data]) => {
        if (symbol.includes('USDT')) {
          if (symbol in symbolsData) {
            symbolsData[symbol].push({ exchange, ...data });
          } else {
            symbolsData[symbol] = [{ exchange, ...data }];
          }
        }
      });
    } catch (err) {
      console.log(`Ошибка обработки данных фандинга. ${err}`);
    }
  }

  return symbolsData;
}

function getArbitrageMessage(arbitrageData, type) {
  if (!arbitrageData) {
    return 'Спред не найден';
  }

  const { symbol, buyOption, sellOption, rateSpread, priceSpread } = arbitrageData;

  const formattedBuyPredictedFundingRate =
    typeof buyOption.predictedFundingRate === 'string'
      ? buyOption.predictedFundingRate
      : buyOption.predictedFundingRate.toFixed(4);
  const formattedSellPredictedFundingRate =
    typeof sellOption.predictedFundingRate === 'string'
      ? sellOption.predictedFundingRate
      : sellOption.predictedFundingRate.toFixed(4);

  let buyMessage = '';
  if (type === 'futures') {
    buyMessage = `📗Покупка(LONG) на ${EXCHANGE_NAME[buyOption.exchange]}\nТекущая: ${buyOption.fundingRate.toFixed(
      4
    )}% (${FUNDING_TYPE[buyOption.exchange]})\nПрогнозная: ${formattedBuyPredictedFundingRate}%\n🕐Следующая выплата: ${
      buyOption.nextFundingTime
    } (${buyOption.fundingInterval}ч)\n${buyOption.futuresLink}\n\n`;
  } else if (type === 'spot') {
    buyMessage = `📗Покупка(LONG) на ${EXCHANGE_NAME[buyOption.exchange]}\n${buyOption.spotLink}\n\n`;
  }

  const sellMessage = `📕Продажа(SHORT) на ${
    EXCHANGE_NAME[sellOption.exchange]
  }\nТекущая: ${sellOption.fundingRate.toFixed(4)}% (${
    FUNDING_TYPE[sellOption.exchange]
  })\nПрогнозная: ${formattedSellPredictedFundingRate}%\n🕐Следующая выплата: ${sellOption.nextFundingTime} (${
    sellOption.fundingInterval
  }ч)\n${sellOption.futuresLink}\n\n`;

  return `Пара: ${symbol}\n\n${buyMessage}${sellMessage}💰Спред:\nТекущий: ${rateSpread.toFixed(
    2
  )}%\nКурсовой: ${priceSpread.toFixed(2)}%`;
}

function findArbitrages(symbolsData) {
  const newFuturesArbitrages = [];
  const newSpotFuturesArbitrages = [];

  Object.entries(symbolsData).forEach(([symbol, data]) => {
    if (data.length > 1) {
      const sortedData = data.sort((a, b) => a.fundingRate - b.fundingRate);

      sortedData.forEach((buyFuturesOption, idx) => {
        const sellFuturesOption = data.sort((a, b) => b.fundingRate - a.fundingRate)[idx];
        const buySpotOption = sortedData.sort((a, b) => a.indexPrice - b.indexPrice)[idx];

        const buyFundingRate = buyFuturesOption.fundingRate;
        const sellFundingRate = sellFuturesOption.fundingRate;
        let rateSpread = 0;

        if (buyFundingRate < sellFundingRate) {
          if (buyFundingRate < 0 && sellFundingRate > 0) {
            rateSpread = Math.abs(buyFundingRate + -sellFundingRate);
          } else if ((buyFundingRate > 0 && sellFundingRate > 0) || (buyFundingRate < 0 && sellFundingRate < 0)) {
            rateSpread = Math.abs(buyFundingRate - sellFundingRate);
          }
        }

        const buyMarkPrice = buyFuturesOption.markPrice;
        const buyIndexPrice = buySpotOption.indexPrice;
        const sellMarkPrice = sellFuturesOption.markPrice;

        let markPriceSpread = (sellMarkPrice / buyMarkPrice - 1) * 100;
        let indexPriceSpread = (sellMarkPrice / buyIndexPrice - 1) * 100;

        if (buyFuturesOption.multiplier !== 1) {
          markPriceSpread = markPriceSpread / buyFuturesOption.multiplier - buyFuturesOption.multiplier / 10;
          indexPriceSpread = indexPriceSpread / buyFuturesOption.multiplier - buyFuturesOption.multiplier / 10;
        } else if (sellFuturesOption.multiplier !== 1) {
          markPriceSpread = markPriceSpread / sellFuturesOption.multiplier - sellFuturesOption.multiplier / 10;
          indexPriceSpread = indexPriceSpread / sellFuturesOption.multiplier - sellFuturesOption.multiplier / 10;
        }

        if (
          buyFuturesOption.exchange !== sellFuturesOption.exchange &&
          rateSpread >= MIN_SPREAD &&
          (markPriceSpread > 0 || buyFuturesOption.fundingInterval !== 8 || sellFuturesOption.fundingInterval !== 8)
        ) {
          const id = `${symbol}-${buyFuturesOption.exchange}-${sellFuturesOption.exchange}`;

          const arbitrageData = {
            id,
            symbol,
            buyOption: buyFuturesOption,
            sellOption: sellFuturesOption,
            rateSpread,
            priceSpread: markPriceSpread,
          };

          newFuturesArbitrages.push(arbitrageData);
        }

        if (sellFundingRate >= MIN_SPREAD && (indexPriceSpread > 0 || sellFuturesOption.fundingInterval !== 8)) {
          const id = `${symbol}-${buySpotOption.exchange}-${sellFuturesOption.exchange}`;

          const arbitrageData = {
            id,
            symbol,
            buyOption: buySpotOption,
            sellOption: sellFuturesOption,
            rateSpread: sellFundingRate,
            priceSpread: indexPriceSpread,
          };

          newSpotFuturesArbitrages.push(arbitrageData);
        }
      });
    }
  });

  futuresArbitrages = newFuturesArbitrages.sort((a, b) => b.rateSpread - a.rateSpread);
  spotFuturesArbitrages = newSpotFuturesArbitrages.sort((a, b) => b.rateSpread - a.rateSpread);
}

bot.command('spreads', (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, 'Спреды фьчерсов', {
    reply_markup: {
      inline_keyboard: futuresArbitrages.map((futuresArbitrage) => [mapArbitrageToButton(futuresArbitrage, 'futures')]),
    },
  });
});

bot.command('spot_futures', (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, 'Спреды спот-фьчерсов', {
    reply_markup: {
      inline_keyboard: spotFuturesArbitrages.map((spotFuturesArbitrage) => [
        mapArbitrageToButton(spotFuturesArbitrage, 'spot'),
      ]),
    },
  });
});

bot.action(/^(futures|spot)-\w+USDT-[a-z]{3,7}-[a-z]{3,7}$/, (ctx) => {
  const id = ctx.match[0].split('-').slice(1).join('-');
  const type = ctx.match[0].split('-')[0];
  const detailedArbitrage = futuresArbitrages.concat(spotFuturesArbitrages).find((arbitrage) => arbitrage.id === id);

  ctx.reply(getArbitrageMessage(detailedArbitrage, type), Extra.webPreview(false));
});

(async function () {
  bot.launch();

  while (true) {
    console.log(`${getTimeString()}: Поиск спредов...`);
    const symbolsData = await parseFundingRatesData();
    findArbitrages(symbolsData);

    const futuresArbitragesLength = futuresArbitrages.length;
    const spotFuturesArbitragesLength = spotFuturesArbitrages.length;
    console.log(
      `${getTimeString()}: Найдено арбитражных сделок: ${futuresArbitragesLength}, спот-фьчерс: ${spotFuturesArbitragesLength}`
    );
    console.log(`${getTimeString()}: Следующая итерация через 60 секунд.`);
    await sleep(60);
  }
})();
