require('dotenv').config(); // to access .env
const flags = require('../utils/data/flags.json');

module.exports = {
  up(queryInterface) {
    return queryInterface.bulkInsert('Flags', flags.flags);
  },

  down(queryInterface) {
    return queryInterface.bulkDelete('Flags', null);
  }
};
