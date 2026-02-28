const axios = require('axios');

const { ExchangeName } = require('../constants');
const { formatFundingRate, getTimeString } = require('../utils');

class Bybit {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.bybit.com/ru-RU/trade/spot/${currency}/USDT`;
  }

  getFuturesTradeLink(symbol) {
    return `https://www.bybit.com/trade/usdt/${symbol}`;
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get(
        'https://api.bybit.com/v5/market/tickers?category=linear'
      );

      return fundingRates.result.list
        .filter((fundingRate) => !fundingRate.symbol.includes('-'))
        .reduce((acc, fundingRate) => {
          const symbol = fundingRate.symbol;
          const nextFundingTime = parseInt(fundingRate.nextFundingTime);

          return {
            ...acc,
            [symbol.replace(/^10+/g, '')]: {
              fundingRate: formatFundingRate(fundingRate.fundingRate),
              indexPrice: fundingRate.indexPrice,
              markPrice: fundingRate.markPrice,
              nextFundingTime: getTimeString(nextFundingTime),
              fundingInterval: parseInt(fundingRate.fundingIntervalHour),
              predictedFundingRate: '-',
              spotLink: this.getSpotTradeLink(symbol.replace(/^10+/g, '')),
              futuresLink: this.getFuturesTradeLink(symbol),
              multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
            },
          };
        });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${ExchangeName.BYBIT}. ${err?.message}`);
    }
  }
}

module.exports = new Bybit();
