const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getFundingInterval, getTimeString } = require('../utils');

class CoinEx {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0].toLowerCase();
    return `https://www.coinex.com/ru/exchange/${currency}-usdt`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0].toLowerCase();
    return `https://www.coinex.com/ru/futures/${currency}-usdt`;
  }

  getNextFundingTime(fundingTime) {
    const currentTimestamp = new Date();
    const minutes = currentTimestamp.getMinutes() + fundingTime;
    currentTimestamp.setMinutes(minutes % 60 === 0 ? minutes : minutes + 1);
    currentTimestamp.setSeconds(0);
    return currentTimestamp.setMilliseconds(0);
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get('https://api.coinex.com/perpetual/v1/market/ticker/all');

      return Object.entries(fundingRates.data.ticker)
        .filter(([symbol]) => !symbol.includes('_'))
        .reduce(async (acc, [symbol, fundingRate]) => {
          try {
            const { data: fundingHistory } = await axios.get(
              `https://api.coinex.com/perpetual/v1/market/funding_history?market=${symbol}&offset=0&limit=1`
            );

            const nextFundingTime = this.getNextFundingTime(fundingRate.funding_time);
            const fundingInterval = getFundingInterval(
              nextFundingTime,
              fundingHistory.data.records[0]?.time && fundingHistory.data.records[0].time * 1000
            );

            return {
              ...(await acc),
              [symbol.replace(/^10+/g, '')]: {
                fundingRate: formatFundingRate(fundingRate.funding_rate_next),
                indexPrice: fundingRate.index_price,
                markPrice: fundingRate.sign_price,
                nextFundingTime: getTimeString(nextFundingTime),
                fundingInterval,
                predictedFundingRate: formatFundingRate(fundingRate.funding_rate_predict),
                spotLink: this.getSpotTradeLink(symbol),
                futuresLink: this.getFuturesTradeLink(symbol),
                multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
              },
            };
          } catch (err) {
            console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.coinex} (${symbol}). ${err?.message}`);
          }
        });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.coinex}. ${err?.message}`);
    }
  }
}

module.exports = new CoinEx();
