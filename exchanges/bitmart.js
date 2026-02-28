const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getTimeString } = require('../utils');

class BitMart {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.bitmart.com/trade/ru-RU?symbol=${currency}_USDT&type=spot`;
  }

  getFuturesTradeLink(symbol) {
    return `https://derivatives.bitmart.com/ru-RU?symbol=${symbol}`;
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get('https://api-cloud-v2.bitmart.com/contract/public/details');

      return fundingRates.data.symbols.reduce((acc, fundingRate) => ({
        ...acc,
        [fundingRate.symbol.replace(/^10+/g, '')]: {
          fundingRate: formatFundingRate(fundingRate.expected_funding_rate),
          indexPrice: fundingRate.index_price,
          markPrice: fundingRate.last_price,
          nextFundingTime: getTimeString(fundingRate.funding_time),
          fundingInterval: fundingRate.funding_interval_hours,
          predictedFundingRate: '-',
          spotLink: this.getSpotTradeLink(fundingRate.symbol.replace(/^10+/g, '')),
          futuresLink: this.getFuturesTradeLink(fundingRate.symbol),
          multiplier: fundingRate.symbol.match(/^10+/g)?.[0] ?? 1,
        },
      }));
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.bitmart}. ${err?.message}`);
    }
  }
}

module.exports = new BitMart();
