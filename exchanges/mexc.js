const axios = require('axios');

const { EXCHANGE_NAME } = require('../constants');
const { formatFundingRate, getFundingInterval, getTimeString } = require('../utils');

class MEXC {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.mexc.com/ru-RU/exchange/${currency}_USDT`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://futures.mexc.com/exchange/${currency}_USDT`;
  }

  async getFundingRates() {
    try {
      const { data: contracts } = await axios.get('https://contract.mexc.com/api/v1/contract/detail');

      const symbols = contracts.data
        .filter((contract) => contract.symbol.split('_')[1] === 'USDT')
        .map((contract) => contract.symbol);

      const fundingRates = {};

      for await (let symbol of symbols) {
        try {
          const { data: fundingRate } = await axios.get(
            `https://contract.mexc.com/api/v1/contract/funding_rate/${symbol}`
          );
          const { data: indexPrice } = await axios.get(
            `https://contract.mexc.com/api/v1/contract/index_price/${symbol}`
          );
          const { data: markPrice } = await axios.get(`https://contract.mexc.com/api/v1/contract/fair_price/${symbol}`);
          const { data: fundingHistory } = await axios.get(
            `https://contract.mexc.com/api/v1/contract/funding_rate/history?symbol=${symbol}&page_num=1&page_size=1`
          );

          symbol = symbol.split('_').join('');
          const fundingRateData = fundingRate.data;
          const nextFundingTime = fundingRateData.nextSettleTime;
          const fundingInterval = getFundingInterval(nextFundingTime, fundingHistory.data.resultList[0].settleTime);

          fundingRates[symbol.replace(/^10+/g, '')] = {
            fundingRate: formatFundingRate(fundingRateData.fundingRate),
            indexPrice: indexPrice.data.indexPrice,
            markPrice: markPrice.data.fairPrice,
            nextFundingTime: getTimeString(nextFundingTime),
            fundingInterval,
            predictedFundingRate: '-',
            spotLink: this.getSpotTradeLink(symbol),
            futuresLink: this.getFuturesTradeLink(symbol),
            multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
          };
        } catch (err) {
          console.log(`Ошибка обработки данных фандинга ${EXCHANGE_NAME.mexc} (${symbol}). ${err?.message}`);
        }
      }

      return fundingRates;
    } catch (err) {
      console.log(`Ошибка получения данных фандинга ${EXCHANGE_NAME.mexc}. ${err?.message}`);
    }
  }
}

module.exports = new MEXC();
