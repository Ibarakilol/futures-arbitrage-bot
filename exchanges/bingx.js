const axios = require('axios');

const { ExchangeName } = require('../constants');
const { formatFundingRate, getTimeString } = require('../utils');

class BingX {
  getSpotTradeLink(symbol) {
    return `https://bingx.com/en/spot/${symbol}`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://bingx.com/en/perpetual/${currency}-USDT`;
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get(
        'https://open-api.bingx.com/openApi/swap/v2/quote/premiumIndex'
      );

      return fundingRates.data.reduce((acc, fundingRate) => {
        const symbol = `${fundingRate.symbol.split('-')[0]}USDT`;

        return {
          ...acc,
          [symbol.replace(/^10+/g, '')]: {
            fundingRate: formatFundingRate(fundingRate.lastFundingRate),
            indexPrice: fundingRate.indexPrice,
            markPrice: fundingRate.markPrice,
            nextFundingTime: getTimeString(fundingRate.nextFundingTime),
            fundingInterval: 8,
            predictedFundingRate: '-',
            spotLink: this.getSpotTradeLink(symbol.replace(/^10+/g, '')),
            futuresLink: this.getFuturesTradeLink(symbol),
            multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
          },
        };
      });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${ExchangeName.BINGX}. ${err?.message}`);
    }
  }
}

module.exports = new BingX();
