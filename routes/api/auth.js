const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');

const { auth, generateToken } = require('../../middleware/auth');
const { User } = require('../../models/index');

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
      if (!isMatch)
        return res.status(400).json({ msg: '!Invalid credentials' });
      const token = generateToken(user);
      res.json({ token, user });
    });
  });
});

// @route   GET api/auth/user
// @desc    Determine user
// @access  Protected
// Avoid findByPk() when you want to pass in more attributes
router.get('/user', auth, (req, res) => {
  User.findOne({
    where: { id: req.user.id },
    attributes: { exclude: ['password'] }
  }).then(user => res.json({ user }));
});
router.get('/whoami', auth, (req, res) => {
  User.findOne({
    where: { id: req.user.id },
    attributes: { exclude: ['password'] }
  }).then(user => res.json(user));
});

module.exports = router;
