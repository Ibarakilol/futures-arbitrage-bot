const binance = require('./binance');
const bingx = require('./bingx');
const bitget = require('./bitget');
const bitmart = require('./bitmart');
const bybit = require('./bybit');
const coinex = require('./coinex');
const huobi = require('./huobi');
const kucoin = require('./kucoin');
const mexc = require('./mexc');
const okx = require('./okx');

async function getFundingRates(exchange) {
  switch (exchange) {
    case 'binance':
      return await binance.getFundingRates();
    case 'bingx':
      return await bingx.getFundingRates();
    case 'bitget':
      return await bitget.getFundingRates();
    case 'bitmart':
      return await bitmart.getFundingRates();
    case 'bybit':
      return await bybit.getFundingRates();
    case 'coinex':
      return await coinex.getFundingRates();
    case 'huobi':
      return await huobi.getFundingRates();
    case 'kucoin':
      return await kucoin.getFundingRates();
    case 'mexc':
      return await mexc.getFundingRates();
    case 'okx':
      return await okx.getFundingRates();
    default:
      return null;
  }
}

module.exports = { getFundingRates };
