const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// @desc    Get all users with pagination and search
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete user and all their content
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Use transaction for atomic operations (if supported)
    // Delete all blogs by this user
    await Blog.deleteMany({ author: req.params.id });

    // Delete all comments by this user
    await Comment.deleteMany({ author: req.params.id });

    // Remove user's likes from all blogs
    await Blog.updateMany(
      { likes: req.params.id },
      { $pull: { likes: req.params.id } }
    );

    await User.findByIdAndDelete(req.params.id);

    console.log(`✅ User ${user.email} deleted by admin`);

    res.json({
      success: true,
      message: 'User and all associated content deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all blogs with advanced filtering
// @route   GET /api/admin/blogs
// @access  Private/Admin
exports.getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status; // 'published', 'draft', or undefined
    const skip = (page - 1) * limit;

    // Build filter query
    let filterQuery = {};
    
    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'published') {
      filterQuery.published = true;
    } else if (status === 'draft') {
      filterQuery.published = false;
    }

    const blogs = await Blog.find(filterQuery)
      .populate('author', 'name email')
      .populate('comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get all blogs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching blogs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get comprehensive dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Parallel execution for better performance
    const [
      totalUsers,
      totalBlogs,
      totalComments,
      publishedBlogs,
      recentBlogs,
      recentUsers,
      topBlogs
    ] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Comment.countDocuments(),
      Blog.countDocuments({ published: true }),
      Blog.find({})
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(5),
      Blog.find({})
        .populate('author', 'name email')
        .sort({ likes: -1, createdAt: -1 })
        .limit(5)
    ]);

    // Get weekly stats for charts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyStats = await Blog.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          blogs: { $sum: 1 },
          likes: { $sum: { $size: "$likes" } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalBlogs,
          totalComments,
          publishedBlogs,
          draftBlogs: totalBlogs - publishedBlogs
        },
        recentBlogs,
        recentUsers,
        topBlogs,
        weeklyStats
      },
    });
  } catch (error) {
    console.error('❌ Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle blog publish status
// @route   PATCH /api/admin/blogs/:id/toggle-publish
// @access  Private/Admin
exports.toggleBlogPublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }

    blog.published = !blog.published;
    await blog.save();

    res.json({
      success: true,
      message: `Blog ${blog.published ? 'published' : 'unpublished'} successfully`,
      data: blog
    });
  } catch (error) {
    console.error('❌ Toggle blog publish error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating blog status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};