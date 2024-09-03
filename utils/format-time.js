function getFundingInterval(fundingTime, prevFundingTime) {
  if (fundingTime && prevFundingTime) {
    const duration = Math.abs(
      new Date(fundingTime).getTime() - new Date(prevFundingTime).getTime()
    );
    const fundingInterval = Math.floor(duration / 1000 / 60 / 60);
    return fundingInterval % 2 === 0 ? fundingInterval : fundingInterval + 1;
  } else {
    return 8;
  }
}

function getTimeString(fundingTime, isKucoin = false) {
  const date = fundingTime ? new Date(fundingTime) : new Date();
  const hours = date.getHours();
  const minutes = `0${isKucoin ? 0 : date.getMinutes()}`;
  return `${hours}:${minutes.slice(-2)}`;
}

module.exports = { getFundingInterval, getTimeString };
