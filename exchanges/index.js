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
    case 'BINANCE':
      return await binance.getFundingRates();
    case 'BINGX':
      return await bingx.getFundingRates();
    case 'BITGET':
      return await bitget.getFundingRates();
    case 'BITMART':
      return await bitmart.getFundingRates();
    case 'BYBIT':
      return await bybit.getFundingRates();
    case 'COINEX':
      return await coinex.getFundingRates();
    case 'HUOBI':
      return await huobi.getFundingRates();
    case 'KUCOIN':
      return await kucoin.getFundingRates();
    case 'MEXC':
      return await mexc.getFundingRates();
    case 'OKX':
      return await okx.getFundingRates();
    default:
      return null;
  }
}

module.exports = { getFundingRates };
