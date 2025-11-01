const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Helper function for search query
const buildSearchQuery = (search) => {
  if (!search) return {};
  
  return {
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { 'tags': { $regex: search, $options: 'i' } }
    ]
  };
};

// @desc    Get all blogs with advanced filtering
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      tag,
      author,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { published: true };

    // Filter by category
    if (category && category !== 'All' && category !== 'all') {
      query.category = category;
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Search functionality
    if (search) {
      Object.assign(query, buildSearchQuery(search));
    }

    // Sort configuration
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // If sorting by popularity (likesCount), ensure it exists
    if (sortBy === 'likesCount') {
      query.likesCount = { $exists: true };
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name email avatar bio')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-content'); // Don't send full content in list view for performance

    const totalBlogs = await Blog.countDocuments(query);

    // Get popular tags for sidebar
    const popularTags = await Blog.aggregate([
      { $match: { published: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs,
        hasNext: page * limit < totalBlogs,
        hasPrev: page > 1
      },
      metadata: {
        popularTags,
        totalPublished: totalBlogs
      }
    });
  } catch (error) {
    console.error('❌ Get blogs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching blogs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single blog with related posts
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email avatar bio');

    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog post not found' 
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    // Get related blogs (same category or tags)
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id },
      published: true,
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    })
    .populate('author', 'name email avatar')
    .select('-content')
    .limit(3)
    .sort({ views: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...blog.toObject(),
        relatedBlogs
      }
    });
  } catch (error) {
    console.error('❌ Get blog error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid blog ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching blog',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, category, coverImage, tags, published = true } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }

    // Process tags
    const processedTags = tags ? 
      (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) 
      : [];

    const blog = await Blog.create({
      title: title.trim(),
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      category: category || 'Other',
      coverImage,
      tags: processedTags,
      published: Boolean(published),
      author: req.user.id,
    });

    // Populate author info for response
    await blog.populate('author', 'name email avatar');

    console.log(`✅ New blog created: "${blog.title}" by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: published ? 'Blog published successfully' : 'Blog saved as draft',
      data: blog
    });
  } catch (error) {
    console.error('❌ Create blog error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating blog',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }

    // Check if user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this blog' 
      });
    }

    // Process tags if provided
    if (req.body.tags) {
      req.body.tags = Array.isArray(req.body.tags) ? 
        req.body.tags : 
        req.body.tags.split(',').map(tag => tag.trim());
    }

    // Auto-generate excerpt if content changed but excerpt not provided
    if (req.body.content && !req.body.excerpt) {
      req.body.excerpt = req.body.content.substring(0, 150) + '...';
    }

    blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: new Date() }, 
      {
        new: true,
        runValidators: true,
      }
    ).populate('author', 'name email avatar');

    console.log(`✅ Blog updated: "${blog.title}" by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('❌ Update blog error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid blog ID format' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating blog',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }

    // Check if user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this blog' 
      });
    }

    // Delete cover image from Cloudinary if exists
    if (blog.coverImage) {
      const publicId = blog.coverImage.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`blog_images/${publicId}`);
      } catch (cloudinaryError) {
        console.warn('⚠️ Could not delete Cloudinary image:', cloudinaryError);
      }
    }

    // Delete all comments associated with this blog
    await Comment.deleteMany({ blog: req.params.id });

    await Blog.findByIdAndDelete(req.params.id);

    console.log(`✅ Blog deleted: "${blog.title}" by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Blog and all associated comments deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete blog error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid blog ID format' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting blog',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Like/Unlike blog
// @route   PUT /api/blogs/:id/like
// @access  Private
exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const userId = req.user.id.toString();
    const likes = blog.likes.map((id) => id.toString());
    const hasLiked = likes.includes(userId);

    if (!hasLiked) {
      blog.likes.push(req.user.id);
      blog.likesCount = (blog.likesCount || 0) + 1;
    } else {
      blog.likes = blog.likes.filter((id) => id.toString() !== userId);
      blog.likesCount = Math.max((blog.likesCount || 0) - 1, 0);
    }

    await blog.save();
    const populated = await Blog.findById(blog._id).populate('author', 'name email avatar');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's blogs
// @route   GET /api/blogs/user/:userId
// @access  Public
exports.getUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.userId, published: true })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload image
// @route   POST /api/blogs/upload
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      const message = req.fileValidationError || 'Please upload an image';
      return res.status(400).json({ success: false, message });
    }

    // Upload to cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'blog_images' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      data: { url: result.secure_url }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};