const express = require('express');

const router = express.Router();

const { auth } = require('../../middleware/auth');
const imageController = require('../../controllers/imageController');

/**
 * IMAGES RUD:
 * after a property is listed, the owner may bind to it
 * pictures of it.. views, elevations and room tours
 * NB: SEE PROPERTY ROUTE FOR C of CRUD ON THESE
 */

// @route   GET api/images
// @desc    Fetch all property flags
// @access  Public
router.get('/', imageController.fetchAllImages);

// @route   GET api/images/search?term=caption
// @desc    Search all property images
// @access  Public
router.get('/search', imageController.searchAllImages);

// @route   GET api/images/:id
// @desc    Fetch one property image
// @access  Public
router.get('/:id', imageController.fetchOneImage);

// @route   DELETE api/images/:id
// @desc    Delete an image
// @access  Protected, owner
router.delete('/:id', auth, imageController.deleteImage);

module.exports = router;
