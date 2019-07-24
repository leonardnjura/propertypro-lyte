const faker = require('faker');
const fs = require('fs');
const myUsers = require('../../utils/data/users.json').users;

function generateUsers() {
  // console.log(coolUsers.users)
  let users = [];
  users = myUsers;

  for (let id = 1; id <= 10; id += 1) {
    const email = faker.internet.email().toLowerCase();
    const password =
      '$2a$10$4jJwsHNVGUXpzQgWJn8JuuLLiP1NiVuVFzrujbCplYvzrGtmNb9Cm';
    const avatarUrl = 'https://semantic-ui.com/images/avatar2/small/mark.png';
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const isAdmin = false;
    const createdAt = '2019-07-18T11:19:30.686Z';
    const updatedAt = '2019-07-18T11:19:30.686Z';

    users.push({
      //   id,
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
