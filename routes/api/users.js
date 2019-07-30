const express = require('express');

const router = express.Router();

const { auth, adminOnly } = require('../../middleware/auth');
const userController = require('../../controllers/userController');
const { User } = require('../../models/index');

// @route   GET api/auth/users
// @desc    Fetch all users
// @access  Public
router.get('/users', userController.fetchAllUsers);

// @route   GET api/auth/users/:id
// @desc    Fetch one user
// @access  Public
router.get('/users/:id', userController.fetchOneUser);

// @route   PUT api/auth/users/:id
// @desc    Edit a user
// @access  Protected
router.put(
  '/users/:id',
  auth,
  userController.validate('updateUser'),
  userController.updateUser
);

// @route   DELETE api/auth/users/:id
// @desc    Delete a user
// @access  Protected
router.delete('/users/:id', auth, userController.deleteUser);

// @route   PUT api/auth/users/promote/:id
// @desc    Promote a user
// @access  Private
router.put(
  '/users/promote/:id',
  adminOnly,
  userController.validate('promoteUser'),
  userController.promoteUser
);

// @route   POST api/auth/signup
// @desc    Register a user
// @access  Public
router.post(
  '/signup',
  userController.validate('addUser'),
  userController.addUser
);

// @route   POST api/auth/signin
// @desc    Log in a user
// @access  Public
router.post('/signin', userController.loginUser);

// @route   GET api/auth/user or GET api/auth/whoami
// @desc    Determine user from token
// @access  Protected
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
