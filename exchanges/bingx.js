const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getFundingInterval, getTimeString } = require('../utils');

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
      const { data: fundingsData } = await axios.get('https://open-api.bingx.com/openApi/swap/v2/quote/premiumIndex');
      const fundingRates = {};

      for await (const fundingData of fundingsData.data) {
        const symbol = `${fundingData.symbol.split('-')[0]}USDT`;

        try {
          const { data: fundingHistory } = await axios.get(
            `https://open-api.bingx.com/openApi/swap/v2/quote/fundingRate?symbol=${fundingData.symbol}&limit=1`
          );

          const fundingInterval = getFundingInterval(fundingsData.nextFundingTime, fundingHistory.data[0].fundingTime);

          fundingRates[symbol.replace(/^10+/g, '')] = {
            fundingRate: formatFundingRate(fundingData.lastFundingRate),
            indexPrice: fundingData.indexPrice,
            markPrice: fundingData.markPrice,
            nextFundingTime: getTimeString(fundingsData.nextFundingTime),
            fundingInterval,
            predictedFundingRate: '-',
            spotLink: this.getSpotTradeLink(symbol.replace(/^10+/g, '')),
            futuresLink: this.getFuturesTradeLink(symbol),
            multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
          };
        } catch (err) {
          console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.bingx} (${symbol}). ${err?.message}`);
        }

        return fundingRates;
      }
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.bingx}. ${err?.message}`);
    }
  }
}

module.exports = new BingX();
