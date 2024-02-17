function formatFundingRate(fundingRate) {
  return fundingRate ? parseFloat(fundingRate) * 100 : '-';
}

module.exports = formatFundingRate;
