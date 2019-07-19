const config = require('config');
const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');

// User Model
// const User = require('../../models/User');
const { User } = require('../../models/index');

// @route   GET api/users
// @desc    Fetch all users
// @access  Public
router.get('/', (req, res) => {
  User.findAll({ limit: 100, order: [['updatedAt', 'DESC']] })
    .then(users => res.status(200).json(users))
    .catch(err => console.log(err));
});

// @route   GET api/users/:id
// @desc    Fetch one user
// @access  Public
router.get('/:id', (req, res) => {
  User.findOne({ where: { id: req.params.id } })
    .then(user => {
      if (!user) {
        // user object is always there but object may be null
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return res.json({ user });
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
});

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post('/', (req, res) => {
  const { firstName, lastName, email, password } = req.body;
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
      firstName,
      lastName,
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
          .then(user => {
            jwt.sign(
              { id: user.id, email: user.email },
              config.get('JWT_SECRET'),
              { expiresIn: 3600 * 7 },
              (err, token) => {
                if (err) throw err;
                res.status(201).json({
                  token,
                  user: {
                    // avoid pswd / annoying yada yada display
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    password: user.password,
                    createdAt: user.createdAt
                  }
                });
              }
            );
          })
          .catch(err => {
            res.status(404).json({ success: false, error: err });
          });
      });
    });
  });
});

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Protected
router.put('/:id', auth, (req, res) => {
  const { firstName, lastName } = req.body;
  // required fields?
  if (!firstName || !lastName) {
    return res
      .status(400)
      .json({ msg: '!Please update name fields: firstName, lastName' });
  }
  User.findOne({ where: { id: req.params.id } })
    .then(user => {
      if (!user) {
        // user object is always there but object may be null
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return user.update({ firstName, lastName }).then(() =>
        res.json({
          user: {
            // avoid pswd / annoying yada yada display
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            updatedAt: user.updatedAt
          },
          success: true
        })
      );
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Protected
router.delete('/:id', auth, (req, res) => {
  User.findOne({ where: { id: req.params.id } })
    .then(user => {
      if (!user) {
        // user object is always there but object may be null
        return res.status(404).json({ success: false, msg: '!User not found' });
      }
      return user.destroy().then(() => res.json({ success: true }));
    })
    .catch(err => res.status(400).json({ success: false, error: err }));
});

module.exports = router;
