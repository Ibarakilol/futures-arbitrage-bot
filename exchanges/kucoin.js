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
      const { data: fundingRates } = await axios.get('https://api-futures.kucoin.com/api/v1/contracts/active');

      return fundingRates.data
        .filter((fundingRate) => fundingRate.fundingFeeRate)
        .reduce(async (acc, fundingRate) => {
          const symbol = fundingRate.symbol.slice(0, -1);

          try {
            const { data: fundingHistory } = await axios.get(
              `https://www.kucoin.com/_api_kumex/web-front/contract/${symbol}M/funding-rates?reverse=true&maxCount=1`
            );

            const nextFundingTime = Date.now() + fundingRate.nextFundingRateTime;
            const fundingInterval = getFundingInterval(nextFundingTime, fundingHistory.data.dataList[0].timePoint);

            return {
              ...(await acc),
              [symbol.replace(/^10+/g, '')]: {
                fundingRate: formatFundingRate(fundingRate.fundingFeeRate),
                indexPrice: fundingRate.indexPrice,
                markPrice: fundingRate.markPrice,
                nextFundingTime: getTimeString(nextFundingTime),
                fundingInterval,
                predictedFundingRate: formatFundingRate(fundingRate.predictedFundingFeeRate),
                spotLink: this.getSpotTradeLink(symbol),
                futuresLink: this.getFuturesTradeLink(symbol),
                multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
              },
            };
          } catch (err) {
            console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.kucoin} (${symbol}). ${err?.message}`);
          }
        });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.kucoin}. ${err?.message}`);
    }
  }
}

module.exports = new KuCoin();
