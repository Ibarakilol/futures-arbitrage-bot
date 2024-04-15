const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getFundingInterval, getTimeString } = require('../utils');

class KuCoin {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.kucoin.com/ru/trade/${currency}-USDT`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.kucoin.com/ru/futures/trade/${currency}USDTM`;
  }

  async getFundingRates() {
    try {
      const { data: contracts } = await axios.get('https://api-futures.kucoin.com/api/v1/contracts/active');
      const fundingRates = {};

      for await (const contract of contracts.data) {
        const symbol = contract.symbol.slice(0, -1);

        if (typeof contract.fundingFeeRate === 'number') {
          try {
            const { data: fundingHistory } = await axios.get(
              `https://www.kucoin.com/_api_kumex/web-front/contract/${symbol}M/funding-rates?reverse=true&maxCount=1`
            );

            const nextFundingTime = Date.now() + contract.nextFundingRateTime;
            const fundingInterval = getFundingInterval(nextFundingTime, fundingHistory.data.dataList[0].timePoint);

            fundingRates[symbol.replace(/^10+/g, '')] = {
              fundingRate: formatFundingRate(contract.fundingFeeRate),
              indexPrice: contract.indexPrice,
              markPrice: contract.markPrice,
              nextFundingTime: getTimeString(nextFundingTime),
              fundingInterval,
              predictedFundingRate: formatFundingRate(contract.predictedFundingFeeRate),
              spotLink: this.getSpotTradeLink(symbol),
              futuresLink: this.getFuturesTradeLink(symbol),
              multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
            };
          } catch (err) {
            console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.kucoin} (${symbol}). ${err?.message}`);
          }
        }
      }

      return fundingRates;
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.kucoin}. ${err?.message}`);
    }
  }
}

module.exports = new KuCoin();
