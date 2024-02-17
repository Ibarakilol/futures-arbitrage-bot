const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getFundingInterval, getTimeString } = require('../utils');

class Bybit {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.bybit.com/ru-RU/trade/spot/${currency}/USDT`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.bybit.com/trade/usdt/${currency}USDT`;
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get(
        'https://api.bybit.com/derivatives/v3/public/tickers?category=linear'
      );

      return fundingRates.result.list
        .filter((fundingRate) => !fundingRate.symbol.includes('-'))
        .reduce(async (acc, fundingRate) => {
          const symbol = fundingRate.symbol;

          try {
            const { data: fundingHistory } = await axios.get(
              `https://api.bybit.com/derivatives/v3/public/funding/history-funding-rate?symbol=${symbol}&limit=1`
            );

            const nextFundingTime = parseInt(fundingRate.nextFundingTime);
            const fundingInterval = getFundingInterval(
              nextFundingTime,
              parseInt(fundingHistory.result.list[0].fundingRateTimestamp)
            );

            return {
              ...(await acc),
              [symbol.replace(/^10+/g, '')]: {
                fundingRate: formatFundingRate(fundingRate.fundingRate),
                indexPrice: fundingRate.indexPrice,
                markPrice: fundingRate.markPrice,
                nextFundingTime: getTimeString(nextFundingTime),
                fundingInterval,
                predictedFundingRate: '-',
                spotLink: this.getSpotTradeLink(symbol),
                futuresLink: this.getFuturesTradeLink(symbol),
                multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
              },
            };
          } catch (err) {
            console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.bybit} (${symbol}). ${err?.message}`);
          }
        });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.bybit}. ${err?.message}`);
    }
  }
}

module.exports = new Bybit();
