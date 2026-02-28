const { ArbitrageType } = require('../constants');

function formatArbitrageButton(arbitrage, type) {
  let nonStandartInterval = '';

  if (
    type === ArbitrageType.FUTURES &&
    (arbitrage.buyOption.fundingInterval !== 8 || arbitrage.sellOption.fundingInterval !== 8)
  ) {
    nonStandartInterval = ' 🕐';
  } else if (type === ArbitrageType.SPOT && arbitrage.sellOption.fundingInterval !== 8) {
    nonStandartInterval = ' 🕐';
  }

  return {
    text: `${arbitrage.symbol}: ${arbitrage.rateSpread.toFixed(2)}% | ${arbitrage.priceSpread.toFixed(
      2
    )}% курс${nonStandartInterval}`,
    callback_data: `${type}-${arbitrage.id}`,
  };
}

module.exports = { formatArbitrageButton };
