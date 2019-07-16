const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');

// User Model
const User = require('../../models/User');

// @route   POST api/auth
// @desc    Authenticate user
// @access  Public
router.post('/', (req, res) => {
  const { email, password } = req.body;
  // required fields?
  if (!email || !password) {
    return res
      .status(400)
      .json({ msg: '!Please enter required fields: email, password' });
  }
  User.findOne({ where: { email } }).then(user => {
    // existing user?
    if (!user) return res.status(400).json({ msg: '!User does not exist' });

    // validate password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
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
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email,
              password: user.password,
              createdAt: user.createdAt
            }
          });
        }
      );
    });
  });
});

// @route   GET api/auth/user
// @desc    Determine user
// @access  Protected
// Avoid findByPk() when you want to pass in more attributes 
router.get('/user', auth, (req, res) => {
  User.findOne({ where: { id: req.user.id}, attributes: { exclude: ['password'] } })
    .then(user => res.json(user));
});
router.get('/whoami', auth, (req, res) => {
  User.findOne({ where: { id: req.user.id}, attributes: { exclude: ['password'] } })
    .then(user => res.json(user));
});

module.exports = router;
