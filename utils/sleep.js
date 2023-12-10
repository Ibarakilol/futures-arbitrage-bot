async function sleep(sec) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

module.exports = sleep;
