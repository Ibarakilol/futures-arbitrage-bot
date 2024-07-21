const path = require('path');
const { readFileSync } = require('fs');

// const { User } = require('../models');

async function requestAuth(username) {
  // const user = await User.findOne({ where: { username } });
  const data = readFileSync(path.join(__dirname, '../db.json'));
  const user = JSON.parse(data).find((user) => user.username === username);

  if (!user || (user?.expire_date && user.expire_date > Date.now())) {
    return null;
  }

  return user;
}

module.exports = requestAuth;
