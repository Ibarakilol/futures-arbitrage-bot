const { User } = require('../models');

async function requestAuth(username) {
  const user = await User.findOne({ where: { username } });

  if (!user || user.expire_date > Date.now()) {
    return null;
  }

  return user;
}

module.exports = requestAuth;
