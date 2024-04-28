const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getTimeString } = require('../utils');

class Bitget {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.bitget.com/ru/spot/${currency}USDT`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.bitget.com/ru/futures/usdt/${currency}USDT`;
  }

  async getFundingRates() {
    try {
      const { data: fundingsData } = await axios.get(
        'https://api.bitget.com/api/mix/v1/market/tickers?productType=umcbl'
      );
      const fundingRates = {};

      for await (const fundingData of fundingsData.data) {
        const symbol = fundingData.symbol.split('_')[0];

        try {
          const { data: fundingTime } = await axios.get(
            `https://api.bitget.com/api/mix/v1/market/funding-time?symbol=${fundingData.symbol}`
          );

          fundingRates[symbol.replace(/^10+/g, '')] = {
            fundingRate: formatFundingRate(fundingData.fundingRate),
            indexPrice: fundingData.indexPrice,
            markPrice: fundingData.last,
            nextFundingTime: getTimeString(fundingTime.fundingTime),
            fundingInterval: parseInt(fundingTime.ratePeriod),
            predictedFundingRate: '-',
            spotLink: this.getSpotTradeLink(symbol.replace(/^10+/g, '')),
            futuresLink: this.getFuturesTradeLink(symbol),
            multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
          };
        } catch (err) {
          console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.bitget} (${symbol}). ${err?.message}`);
        }

        return fundingRates;
      }
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.bitget}. ${err?.message}`);
    }
  }
}

module.exports = new Bitget();
