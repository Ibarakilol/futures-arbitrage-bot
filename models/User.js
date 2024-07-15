const { DataTypes } = require('sequelize');

const sequelize = require('../services/database.service');

module.exports = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  first_name: { type: DataTypes.STRING, allowNull: true },
  expire_date: { type: DataTypes.INTEGER, allowNull: true },
  min_spread: { type: DataTypes.FLOAT, defaultValue: 0.5, allowNull: false },
});
