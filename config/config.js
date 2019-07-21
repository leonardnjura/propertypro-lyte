const { DATABASE_USER, DATABASE_PASSWORD, HOST, DATABASE_NAME } = process.env;

module.exports = {
  development: {
    username: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: 'propertypro_lyte_development',
    host: HOST,
    dialect: 'postgres'
  },
  test: {
    username: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: 'propertypro_lyte_test',
    host: HOST,
    dialect: 'postgres'
  },
  production: {
    username: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    host: HOST,
    dialect: 'postgres'
  }
};
