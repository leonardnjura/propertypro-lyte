const Sequelize = require('sequelize');
const db = require('../config/database');

// Schema
const User = db.define('user', {
  email: {
    type: Sequelize.STRING,
    required: true
  },
  firstname: {
    type: Sequelize.STRING,
    required: true
  },
  lastname: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING,
    required: true
  },
  createdAt: {
      type: Sequelize.DATE,
      default: Date.now
  }
});

module.exports = User;
