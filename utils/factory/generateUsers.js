const faker = require('faker');
const fs = require('fs');
const myUsers = require('../../utils/data/users.json').users;

function generateUsers() {
  let users = [];
  users = myUsers;

  for (let id = 1; id <= 10; id += 1) {
    const oneDate = faker.date.recent();
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const meaningfulEmail = `${firstName}.${lastName}@localhost.com`;
    const email = meaningfulEmail.toLowerCase();
    const password =
      '$2a$10$4jJwsHNVGUXpzQgWJn8JuuLLiP1NiVuVFzrujbCplYvzrGtmNb9Cm';
    const avatarUrl = 'https://semantic-ui.com/images/avatar2/small/mark.png';
    const isAdmin = false;
    const createdAt = oneDate;
    const updatedAt = oneDate;

    users.push({
      email,
      password,
      avatarUrl,
      firstName,
      lastName,
      isAdmin,
      createdAt,
      updatedAt
    });
  }

  return { users };
}

const dataObj = generateUsers();

fs.writeFileSync(
  'utils/data/fakerUsers.json',
  JSON.stringify(dataObj, null, '\t')
);
