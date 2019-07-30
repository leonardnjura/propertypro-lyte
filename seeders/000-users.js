require('dotenv').config(); // to access .env
const myUsers = require('../utils/data/users.json');
const fakerUsers = require('../utils/data/fakerUsers.json');

const isDevMode = process.env.NODE_ENV === 'development';
const users = isDevMode ? myUsers : fakerUsers;

module.exports = {
  up(queryInterface) {
    return queryInterface.bulkInsert('Users', users.users);
  },

  down(queryInterface) {
    return queryInterface.bulkDelete('Users', null);
  }
};
