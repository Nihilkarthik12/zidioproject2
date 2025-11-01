const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
  getUserBlogs,
  uploadImage,
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getBlogs);
router.get('/:id', getBlog);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.put('/:id/like', protect, likeBlog);
router.get('/user/:userId', getUserBlogs);
router.post('/upload', protect, upload.single('image'), uploadImage);

module.exports = router;
