const ArbitrageType = { FUTURES: 'futures', SPOT: 'spot' };

const ExchangeFee = {
  BINANCE: 'Плавающая',
  BINGX: 'Плавающая',
  BITGET: 'Фиксируемая',
  BITMART: 'Плавающая',
  BYBIT: 'Плавающая',
  COINEX: 'Плавающая',
  HUOBI: 'Плавающая',
  KUCOIN: 'Фиксируемая',
  MEXC: 'Плавающая',
  OKX: 'Плавающая',
};

const ExchangeName = {
  // BINANCE: 'Binance', // Не работает в России
  BINGX: 'BingX',
  BITGET: 'Bitget',
  // BITMART: 'BitMart', // TODO
  BYBIT: 'Bybit',
  COINEX: 'CoinEx',
  // HUOBI: 'Huobi', // TODO
  // KUCOIN: 'KuCoin', // TODO: Long request
  // MEXC: 'MEXC', // TODO: Long request
  OKX: 'OKX',
};

const FundingType = {
  BINANCE: 'Плавающая',
  BINGX: 'Плавающая',
  BITGET: 'Фиксируемая',
  BITMART: 'Плавающая',
  BYBIT: 'Плавающая',
  COINEX: 'Плавающая',
  HUOBI: 'Плавающая',
  KUCOIN: 'Фиксируемая',
  MEXC: 'Плавающая',
  OKX: 'Плавающая',
};

const Regex = {
  SPREAD: /^(futures|spot)-\w+USDT-[A-Z]{3,7}-[A-Z]{3,7}$/,
  REFRESH_SPREAD: /^refresh-(futures|spot)-\w+USDT-[A-Z]{3,7}-[A-Z]{3,7}$/,
};

module.exports = { ArbitrageType, ExchangeFee, ExchangeName, FundingType, Regex };
