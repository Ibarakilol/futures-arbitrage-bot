const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getFundingInterval, getTimeString } = require('../utils');

class OKX {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0].toLowerCase();
    return `https://www.okx.com/ru/trade-spot/${currency}-usdt`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0].toLowerCase();
    return `https://www.okx.com/ru/trade-swap/${currency}-usdt-swap`;
  }

  formatInstrumentId(instrumentId, separator = '') {
    return instrumentId.split('-').slice(0, -1).join(separator);
  }

  async getFundingRates() {
    try {
      const { data: instruments } = await axios.get('https://www.okx.com/api/v5/public/instruments?instType=SWAP');
      const { data: indexPrices } = await axios.get('https://www.okx.com/api/v5/market/index-tickers?quoteCcy=USDT');
      const { data: markPrices } = await axios.get('https://www.okx.com/api/v5/public/mark-price?instType=SWAP');

      const instrumentIds = instruments.data
        .filter((instrument) => instrument.instId.split('-')[1] === 'USDT')
        .map((instrument) => instrument.instId);

      return instrumentIds.reduce(async (acc, instrumentId) => {
        const symbol = this.formatInstrumentId(instrumentId);

        try {
          const { data: fundingRate } = await axios.get(
            `https://www.okx.com/api/v5/public/funding-rate?instId=${instrumentId}`
          );

          const fundingRateData = fundingRate.data[0];
          const indexPrice = indexPrices.data.find(
            (indexPrice) => indexPrice.instId === this.formatInstrumentId(instrumentId, '-')
          ).idxPx;

          const markPrice = markPrices.data.find((markPrice) => markPrice.instId === instrumentId).markPx;

          const nextFundingTime = parseInt(fundingRateData.fundingTime);
          const fundingInterval = getFundingInterval(parseInt(fundingRateData.nextFundingTime), nextFundingTime);

          return {
            ...(await acc),
            [symbol.replace(/^10+/g, '')]: {
              fundingRate: formatFundingRate(fundingRateData.fundingRate),
              indexPrice,
              markPrice,
              nextFundingTime: getTimeString(nextFundingTime),
              fundingInterval,
              predictedFundingRate: formatFundingRate(fundingRateData.nextFundingRate),
              spotLink: this.getSpotTradeLink(symbol.replace(/^10+/g, '')),
              futuresLink: this.getFuturesTradeLink(symbol),
              multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
            },
          };
        } catch (err) {
          console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.okx} (${symbol}). ${err?.message}`);
        }
      });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.okx}. ${err?.message}`);
    }
  }
}

module.exports = new OKX();
