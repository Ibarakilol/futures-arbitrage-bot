const binance = require('./binance');
const bybit = require('./bybit');
const kucoin = require('./kucoin');
const mexc = require('./mexc');
const huobi = require('./huobi');
const okx = require('./okx');
const coinex = require('./coinex');
const bitget = require('./bitget');

async function getFundingRates(exchange) {
  switch (exchange) {
    case 'binance':
      return await binance.getFundingRates();
    case 'bybit':
      return await bybit.getFundingRates();
    case 'kucoin':
      return await kucoin.getFundingRates();
    case 'mexc':
      return await mexc.getFundingRates();
    case 'huobi':
      return await huobi.getFundingRates();
    case 'okx':
      return await okx.getFundingRates();
    case 'coinex':
      return await coinex.getFundingRates();
    case 'bitget':
      return await bitget.getFundingRates();
    default:
      return null;
  }
}

module.exports = { getFundingRates };
