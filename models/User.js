const { DataTypes } = require('sequelize');

const sequelize = require('../services/database.service');

module.exports = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  expire_date: { type: DataTypes.INTEGER, defaultValue: 4086913558 },
  min_spread: { type: DataTypes.FLOAT, defaultValue: 0.1 },
});
