const { ARBITRAGE_TYPE } = require('../constants');

function mapArbitrageToButton(arbitrage, type) {
  let nonStandartInterval = '';

  if (
    type === ARBITRAGE_TYPE.FUTURES &&
    (arbitrage.buyOption.fundingInterval !== 8 || arbitrage.sellOption.fundingInterval !== 8)
  ) {
    nonStandartInterval = ' 🕐';
  } else if (type === ARBITRAGE_TYPE.SPOT && arbitrage.sellOption.fundingInterval !== 8) {
    nonStandartInterval = ' 🕐';
  }

  return {
    text: `${arbitrage.symbol}: ${arbitrage.rateSpread.toFixed(
      2
    )}% | ${arbitrage.priceSpread.toFixed(2)}% курс${nonStandartInterval}`,
    callback_data: `${type}-${arbitrage.id}`,
  };
}

module.exports = mapArbitrageToButton;
