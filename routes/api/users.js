const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// User Model
const User = require('../../models/User');

// @route   GET api/users
// @desc    Fetch all users
// @access  Public
router.get('/', (req, res) => {
  User.findAll()
    .then(users => res.status(200).json(users))
    .catch(err => console.log(err));
});

// @route   GET api/users/:id
// @desc    Fetch one user
// @access  Public
router.get('/:id', (req, res) => {
  User.findByPk(req.params.id)
    .then(user => res.status(200).json(user))
    .catch(err => {
      res.status(400).json({ success: false });
      throw err;
    });
});

// @route   POST api/users
// @desc    Add a user
// @access  Public
router.post('/', (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  // required fields?
  if (!email || !password) {
    return res
      .status(400)
      .json({ msg: '!Please enter required fields: email, password' });
  }
  User.findOne({ where: { email } }).then(user => {
    // existing user?
    if (user) return res.status(400).json({ msg: '!User already exists' });

    // all ok
    const newUser = new User({
      firstname,
      lastname,
      email,
      password
    });

    // salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser
          .save()
          .then(user =>
            res.status(201).json({
              user: {
                // avoid pswd / annoying yada yada display
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                password: user.password,
                createdAt: user.createdAt
              },
              success: true
            })
          )
          .catch(err => {
            res.status(400).json({ success: false });
            throw err;
          });
      });
    });
  });
});

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Public
router.put('/:id', (req, res) => {
  const { firstname, lastname } = req.body;
  // required fields?
  if (!firstname || !lastname) {
    return res
      .status(400)
      .json({ msg: '!Please update name fields: firstname, lastname' });
  }
  User.findByPk(req.params.id)
    .then(user =>
      user.update({ firstname, lastname }).then(() =>
        res.json({
          user: {
            // avoid pswd / annoying yada yada display
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            updatedAt: user.updatedAt
          },
          success: true
        })
      )
    )
    .catch(err => {
      res.status(404).json({ success: false });
      throw err;
    });
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Public
router.delete('/:id', (req, res) => {
  User.findByPk(req.params.id)
    .then(user => user.destroy().then(() => res.json({ success: true })))
    .catch(err => {
      res.status(404).json({ success: false });
      throw err;
    });
});

module.exports = router;
