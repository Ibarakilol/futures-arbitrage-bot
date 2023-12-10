const axios = require('axios');

const { formatFundingRate, getFundingInterval, getTimeString } = require('../utils');

class Huobi {
  getSpotTradeLink(symbol) {
    const currency = symbol.split('USDT')[0].toLowerCase();
    return `https://www.htx.com/ru-ru/trade/${currency}_usdt?type=spot`;
  }

  getFuturesTradeLink(symbol) {
    const currency = symbol.split('USDT')[0];
    return `https://www.huobi.com/ru-ru/futures/linear_swap/exchange#contract_code=${currency}-USDT&contract_type=swap&type=cross`;
  }

  async getFundingRates() {
    try {
      const { data: fundingRates } = await axios.get('https://api.hbdm.com/linear-swap-api/v1/swap_batch_funding_rate');
      const { data: indexPrices } = await axios.get('https://api.hbdm.com/linear-swap-api/v1/swap_index');
      const { data: markPrices } = await axios.get('https://api.hbdm.com/linear-swap-ex/market/detail/batch_merged');

      return fundingRates.data
        .filter((fundingRate) => fundingRate.funding_rate)
        .reduce((acc, fundingRate) => {
          const symbol = fundingRate.contract_code.replace('-', '');

          const indexPrice = indexPrices.data.find(
            (indexPrice) => indexPrice.contract_code === fundingRate.contract_code
          ).index_price;

          const markPrice = markPrices.ticks.find(
            (markPrice) => markPrice.contract_code === fundingRate.contract_code
          ).close;

          const nextFundingTime = parseInt(fundingRate.funding_time);
          const fundingInterval = getFundingInterval(nextFundingTime, parseInt(fundingRate.next_funding_time));

          return {
            ...acc,
            [symbol.replace(/^10+/g, '')]: {
              fundingRate: formatFundingRate(fundingRate.funding_rate),
              indexPrice,
              markPrice,
              nextFundingTime: getTimeString(nextFundingTime),
              fundingInterval,
              predictedFundingRate: formatFundingRate(fundingRate.estimated_rate),
              spotLink: this.getSpotTradeLink(symbol),
              futuresLink: this.getFuturesTradeLink(symbol),
              multiplier: symbol.match(/^10+/g)?.[0] ?? 1,
            },
          };
        });
    } catch (err) {
      console.log(`Ошибка получения данных фандинга Huobi. ${err?.message}`);
    }
  }
}

module.exports = new Huobi();
