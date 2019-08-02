const express = require('express');

const router = express.Router();

const { auth } = require('../../middleware/auth');
const flagController = require('../../controllers/flagController');

/**
 * FLAGS RUD:
 * after a property is listed, the owner may bind to it
 * flags of it and reasons for its pricing.. the public is free
 * to fling demands and complaints at the property
 * NB: SEE PROPERTY ROUTE FOR C of CRUD ON THESE
 */

// @route   GET api/flags
// @desc    Fetch all property flags
// @access  Public
router.get('/', flagController.fetchAllFlags);

// @route   GET api/flags/search?term=description
// @desc    Search all property flags
// @access  Public
router.get('/search', flagController.searchAllFlags);

// @route   GET api/flags/:id
// @desc    Fetch one property flag
// @access  Public
router.get('/:id', flagController.fetchOneFlag);

// @route   DELETE api/flags/:id
// @desc    Delete an flag
// @access  Protected, owner
router.delete('/:id', auth, flagController.deleteFlag);

module.exports = router;
