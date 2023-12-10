function getFundingInterval(fundingTime, prevFundingTime) {
  const duration = Math.abs(new Date(fundingTime).getTime() - new Date(prevFundingTime).getTime());
  return Math.floor(duration / 1000 / 60 / 60);
}

function getTimeString(fundingTime) {
  const date = fundingTime ? new Date(fundingTime) : new Date();
  const hours = date.getHours();
  const minutes = `0${date.getMinutes()}`;
  return `${hours}:${minutes.slice(-2)}`;
}

module.exports = { getFundingInterval, getTimeString };
