const express = require('express');

const router = express.Router();

const { auth, adminOnly } = require('../../middleware/auth');
const userController = require('../../controllers/userController');

// @route   GET api/users
// @desc    Fetch all users
// @access  Public
router.get('/', userController.fetchAllUsers);

// @route   GET api/users/:id
// @desc    Fetch one user
// @access  Public
router.get('/:id', userController.fetchOneUser);

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post(
  '/',
  userController.validate('createUser'),
  userController.createUser
);

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Protected
router.put(
  '/:id',
  auth,
  userController.validate('updateUser'),
  userController.updateUser
);

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Protected
router.delete('/:id', auth, userController.deleteUser);

// @route   PUT api/users/promote/:id
// @desc    Promote a user
// @access  Private
router.put(
  '/promote/:id',
  adminOnly,
  userController.validate('promoteUser'),
  userController.promoteUser
);

module.exports = router;
