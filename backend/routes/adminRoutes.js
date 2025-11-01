const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deleteUser,
  getAllBlogs,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.use(admin);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/blogs', getAllBlogs);
router.get('/stats', getDashboardStats);

module.exports = router;
