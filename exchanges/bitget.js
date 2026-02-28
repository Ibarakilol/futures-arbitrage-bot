const axios = require('axios');

const { ExchangeName } = require('../constants');
const { formatFundingRate } = require('../utils');

class Bitget {
  getSpotTradeLink(symbol) {
    return `https://www.bitget.com/ru/spot/${symbol}`;
  }

  getFuturesTradeLink(symbol) {
    return `https://www.bitget.com/ru/futures/usdt/${symbol}`;
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get(
        'https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES'
      );

      return fundingRates.data.reduce((acc, fundingRate) => {
        const symbol = fundingRate.symbol;

        return {
          ...acc,
          [symbol.replace(/^10+/g, '')]: {
            fundingRate: formatFundingRate(fundingRate.fundingRate),
            indexPrice: fundingRate.indexPrice,
            markPrice: fundingRate.markPrice,
            nextFundingTime: '-',
            fundingInterval: 8,
            predictedFundingRate: '-',
            spotLink: this.getSpotTradeLink(symbol.replace(/^10+/g, '')),
            futuresLink: this.getFuturesTradeLink(symbol),
            multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
          },
        };
      });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${ExchangeName.BITGET}. ${err?.message}`);
    }
  }
}

module.exports = new Bitget();
