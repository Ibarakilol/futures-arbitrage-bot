require('dotenv').config();
const { Telegraf } = require('telegraf');

const { LEVERAGE, SPREAD, VOLUME } = require('./config');
const { ArbitrageType, ExchangeName, FundingType, Regex } = require('./constants');
const { getFundingRates } = require('./exchanges');
const { formatArbitrageButton, getTimeString, sleep } = require('./utils');

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
  const fundingRatesData = {};

  for await (const exchange of Object.keys(ExchangeName)) {
    try {
      const fundingRates = await getFundingRates(exchange);

      Object.entries(fundingRates).forEach(([symbol, data]) => {
        if (symbol.includes('USDT')) {
          if (symbol in fundingRatesData) {
            fundingRatesData[symbol].push({ exchange, ...data });
          } else {
            fundingRatesData[symbol] = [{ exchange, ...data }];
          }
        }
      });
    } catch (err) {
      console.log(`Ошибка обработки данных фандинга. ${err}`);
    }
  }

  return fundingRatesData;
}

function getArbitrageMessage(arbitrage, type) {
  if (!arbitrage) {
    return 'Спред не найден.';
  }

  const {
    symbol,
    buyOption,
    sellOption,
    rateSpread,
    priceSpread,
    sellPriceDivergence,
    predictedFundingRateSpread,
  } = arbitrage;

  const formattedBuyPredictedFundingRate =
    typeof buyOption.predictedFundingRate === 'string'
      ? buyOption.predictedFundingRate
      : buyOption.predictedFundingRate.toFixed(4);
  const formattedSellPredictedFundingRate =
    typeof sellOption.predictedFundingRate === 'string'
      ? sellOption.predictedFundingRate
      : sellOption.predictedFundingRate.toFixed(4);

  let buyMessage = '';
  if (type === ArbitrageType.FUTURES) {
    buyMessage = `📕Покупка/LONG [${buyOption.markPrice}] на ${
      ExchangeName[buyOption.exchange]
    }\nТекущая: ${buyOption.fundingRate.toFixed(4)}% (${
      FundingType[buyOption.exchange]
    })\nПрогнозная: ${formattedBuyPredictedFundingRate}%\nОтклонение ставки: ${arbitrage.buyPriceDivergence.toFixed(
      2
    )}% ${buyOption.fundingRate > arbitrage.buyPriceDivergence ? '⬇️✅' : '⬆️❌'}\n🕐Следующая выплата: ${
      buyOption.nextFundingTime
    } (${buyOption.fundingInterval}ч)\n${buyOption.futuresLink}\n\n`;
  } else if (type === ArbitrageType.SPOT) {
    buyMessage = `📕Покупка/LONG [${buyOption.indexPrice}] на ${ExchangeName[buyOption.exchange]}\n${
      buyOption.spotLink
    }\n\n`;
  }

  const sellMessage = `📗Продажа/SHORT [${sellOption.markPrice}] на ${
    ExchangeName[sellOption.exchange]
  }\nТекущая: ${sellOption.fundingRate.toFixed(4)}% (${
    FundingType[sellOption.exchange]
  })\nПрогнозная: ${formattedSellPredictedFundingRate}%\nОтклонение ставки: ${sellPriceDivergence.toFixed(2)}% ${
    sellOption.fundingRate > sellPriceDivergence ? '⬇️❌' : '⬆️✅'
  }\n🕐Следующая выплата: ${sellOption.nextFundingTime} (${sellOption.fundingInterval}ч)\n${
    sellOption.futuresLink
  }\n\n`;

  const VOLUME_PER_EXCHANGE = (VOLUME / 2) * (type === ArbitrageType.FUTURES ? LEVERAGE : 1);
  const buyTokenVolume = VOLUME_PER_EXCHANGE / buyOption.markPrice;
  const sellTokenVolume = VOLUME_PER_EXCHANGE / sellOption.markPrice;

  return `Пара: ${symbol}\n\nОбъем для торговли на каждую биржу: $${VOLUME_PER_EXCHANGE}${type === ArbitrageType.FUTURES ? ` (плечо: Х${LEVERAGE})` : ''}\nОбъем монет на каждую биржу: ${Math.min(buyTokenVolume, sellTokenVolume).toFixed(0)}\n\n${buyMessage}${sellMessage}💰Спред:\nТекущий: ${rateSpread.toFixed(
    2
  )}%\nПрогнозный: ${predictedFundingRateSpread.toFixed(2)}%\nКурсовой: ${priceSpread.toFixed(2)}%`;
}

function findArbitrages(fundingRatesData) {
  const newFuturesArbitrages = [];
  const newSpotFuturesArbitrages = [];

  Object.entries(fundingRatesData).forEach(([symbol, data]) => {
    data.forEach((buyOption) => {
      data.forEach((sellOption) => {
        const buyFundingRate = buyOption.fundingRate;
        const sellFundingRate = sellOption.fundingRate;
        let rateSpread = 0;

        if (buyFundingRate < 0 && sellFundingRate > 0) {
          rateSpread = Math.abs(buyFundingRate + -sellFundingRate);
        } else if (buyFundingRate > 0 && sellFundingRate < 0) {
          rateSpread = -buyFundingRate + sellFundingRate;
        } else if (buyFundingRate > 0 && sellFundingRate > 0) {
          if (buyFundingRate < sellFundingRate) {
            rateSpread = -buyFundingRate + sellFundingRate;
          } else {
            rateSpread = buyFundingRate - sellFundingRate;
          }
        } else if (buyFundingRate < 0 && sellFundingRate < 0) {
          if (buyFundingRate < sellFundingRate) {
            rateSpread = Math.abs(buyFundingRate - sellFundingRate);
          } else {
            rateSpread = sellFundingRate - buyFundingRate;
          }
        }

        let buyMarkPrice = buyOption.markPrice;
        let sellMarkPrice = sellOption.markPrice;
        const buyIndexPrice = buyOption.indexPrice;
        const sellIndexPrice = sellOption.indexPrice;

        const buyPriceDivergence = (buyMarkPrice / buyIndexPrice - 1) * 100;
        const sellPriceDivergence = (sellMarkPrice / sellIndexPrice - 1) * 100;

        if (buyOption.multiplier !== sellOption.multiplier) {
          if (buyOption.multiplier !== 1) {
            buyMarkPrice = buyMarkPrice / buyOption.multiplier;
          }

          if (sellOption.multiplier !== 1) {
            sellMarkPrice = sellMarkPrice / sellOption.multiplier;
          }
        }

        const markPriceSpread = (sellMarkPrice / buyMarkPrice - 1) * 100;
        const indexPriceSpread = (sellMarkPrice / buyIndexPrice - 1) * 100;

        const buyPredictedFundingRate =
          typeof buyOption.predictedFundingRate === 'string'
            ? buyPriceDivergence
            : buyOption.predictedFundingRate;
        const sellPredictedFundingRate =
          typeof sellOption.predictedFundingRate === 'string'
            ? sellPriceDivergence
            : sellOption.predictedFundingRate;

        let predictedFundingRateSpread = !!buyPredictedFundingRate
          ? buyPredictedFundingRate
          : sellPredictedFundingRate;

        if (buyPredictedFundingRate < 0 && sellPredictedFundingRate > 0) {
          predictedFundingRateSpread = Math.abs(
            buyPredictedFundingRate + -sellPredictedFundingRate
          );
        } else if (buyPredictedFundingRate > 0 && sellPredictedFundingRate < 0) {
          predictedFundingRateSpread = -buyPredictedFundingRate + sellPredictedFundingRate;
        } else if (buyPredictedFundingRate > 0 && sellPredictedFundingRate > 0) {
          if (buyPredictedFundingRate < sellPredictedFundingRate) {
            predictedFundingRateSpread = -buyPredictedFundingRate + sellPredictedFundingRate;
          } else {
            predictedFundingRateSpread = buyPredictedFundingRate - sellPredictedFundingRate;
          }
        } else if (buyPredictedFundingRate < 0 && sellPredictedFundingRate < 0) {
          if (buyPredictedFundingRate < sellPredictedFundingRate) {
            predictedFundingRateSpread = Math.abs(
              buyPredictedFundingRate - sellPredictedFundingRate
            );
          } else {
            predictedFundingRateSpread = sellPredictedFundingRate - buyPredictedFundingRate;
          }
        }

        if (buyOption.exchange !== sellOption.exchange) {
          newFuturesArbitrages.push({
            id: `${symbol}-${buyOption.exchange}-${sellOption.exchange}`,
            symbol,
            buyOption,
            sellOption,
            rateSpread,
            priceSpread: markPriceSpread,
            buyPriceDivergence,
            sellPriceDivergence,
            buyPredictedFundingRate,
            sellPredictedFundingRate,
            predictedFundingRateSpread,
          });
        }

        newSpotFuturesArbitrages.push({
          id: `${symbol}-${buyOption.exchange}-${sellOption.exchange}`,
          symbol,
          buyOption,
          sellOption,
          rateSpread: sellFundingRate,
          priceSpread: indexPriceSpread,
          sellPriceDivergence,
          predictedFundingRateSpread: sellPredictedFundingRate,
        });
      });
    });
  });

  futuresArbitrages = newFuturesArbitrages.sort((a, b) => b.rateSpread - a.rateSpread);
  spotFuturesArbitrages = newSpotFuturesArbitrages.sort((a, b) => b.rateSpread - a.rateSpread);
}

bot.command('spreads', async (ctx) => {
  const arbitrages = futuresArbitrages.filter(
    (futuresArbitrage) =>
      futuresArbitrage.rateSpread >= SPREAD &&
      futuresArbitrage.buyOption.fundingRate < futuresArbitrage.sellOption.fundingRate
  );

  ctx.reply(arbitrages.length ? 'Спреды фьчерсов:' : 'Спреды фьчерсов не найдены.', {
    reply_markup: {
      inline_keyboard: arbitrages.map((arbitrage) => [
        formatArbitrageButton(arbitrage, ArbitrageType.FUTURES),
      ]),
    },
  });
});

bot.command('spot_futures', async (ctx) => {
  const arbitrages = spotFuturesArbitrages.filter(
    (spotFuturesArbitrage) => spotFuturesArbitrage.rateSpread >= SPREAD
  );

  ctx.reply(arbitrages.length ? 'Спреды спот-фьчерсов:' : 'Спреды спот-фьчерсов не найдены.', {
    reply_markup: {
      inline_keyboard: arbitrages.map((arbitrage) => [
        formatArbitrageButton(arbitrage, ArbitrageType.SPOT),
      ]),
    },
  });
});

bot.action(Regex.SPREAD, (ctx) => {
  const id = ctx.match[0].split('-').slice(1).join('-');
  const type = ctx.match[0].split('-')[0];
  const arbitrage =
    type === ArbitrageType.FUTURES
      ? futuresArbitrages.find((futuresArbitrage) => futuresArbitrage.id === id)
      : spotFuturesArbitrages.find((spotFuturesArbitrage) => spotFuturesArbitrage.id === id);

  ctx.reply(getArbitrageMessage(arbitrage, type), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Обновить',
            callback_data: `refresh-${ctx.match[0]}`,
          },
        ],
      ],
    },
    disable_web_page_preview: true,
  });
});

bot.action(Regex.REFRESH_SPREAD, (ctx) => {
  const id = ctx.match[0].split('-').slice(2).join('-');
  const type = ctx.match[0].split('-')[1];
  const arbitrage =
    type === ArbitrageType.FUTURES
      ? futuresArbitrages.find((futuresArbitrage) => futuresArbitrage.id === id)
      : spotFuturesArbitrages.find((spotFuturesArbitrage) => spotFuturesArbitrage.id === id);
  const arbitrageMessage = getArbitrageMessage(arbitrage, type);

  if (arbitrageMessage !== ctx.callbackQuery.message.text) {
    ctx.editMessageText(arbitrageMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Обновить',
              callback_data: ctx.match[0],
            },
          ],
        ],
      },
      disable_web_page_preview: true,
    });
  }
});

bot.on('message', async (ctx) => {
  ctx.reply('Неверная команда.');
});

(async function () {
  try {
    bot.launch();

    while (true) {
      console.log(`${getTimeString()}: Поиск спредов...`);
      const fundingRatesData = await parseFundingRatesData();
      findArbitrages(fundingRatesData);
      console.log(`${getTimeString()}: Поиск закончен. Следующая итерация через 10 секунд.`);
      await sleep(10);
    }
  } catch (err) {
    console.log(err);
  }
})();
