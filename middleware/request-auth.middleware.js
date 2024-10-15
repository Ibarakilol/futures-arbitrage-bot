const { User } = require('../models');

async function requestAuth(username) {
  try {
    const user = await User.findOne({ where: { username } });

    if (!user || user.expire_date > Date.now()) {
      return null;
    }

    return user;
  } catch (err) {
    return null;
  }
}

module.exports = requestAuth;
