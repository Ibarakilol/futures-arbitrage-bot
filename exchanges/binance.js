const axios = require('axios');

const { ExchangeName } = require('../constants');
const { formatFundingRate, getTimeString } = require('../utils');

class Binance {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.binance.com/ru/trade/${currency}_USDT?type=spot`;
  }

  getFuturesTradeLink(symbol) {
    return `https://www.binance.com/ru/futures/${symbol}`;
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get(
        'https://fapi.binance.com/fapi/v1/premiumIndex'
      );
      const { data: fundingIntervals } = await axios.get(
        'https://fapi.binance.com/fapi/v1/fundingInfo'
      );

      return fundingRates.reduce((acc, fundingRate) => {
        const symbol = fundingRate.symbol;
        const fundingInterval =
          fundingIntervals.find((fundingInterval) => fundingInterval.symbol === symbol)
            ?.fundingIntervalHours ?? 8;

        return {
          ...acc,
          [symbol.replace(/^10+/g, '')]: {
            fundingRate: formatFundingRate(fundingRate.lastFundingRate),
            indexPrice: fundingRate.indexPrice,
            markPrice: fundingRate.markPrice,
            nextFundingTime: getTimeString(fundingRate.nextFundingTime),
            fundingInterval,
            predictedFundingRate: '-',
            spotLink: this.getSpotTradeLink(symbol.replace(/^10+/g, '')),
            futuresLink: this.getFuturesTradeLink(symbol),
            multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
          },
        };
      });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${ExchangeName.BINANCE}. ${err?.message}`);
    }
  }
}

module.exports = new Binance();
