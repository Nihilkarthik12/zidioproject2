const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const User = require('../models/User');

// @desc    Get comments for a blog with pagination
// @route   GET /api/comments/:blogId
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate blog exists
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog post not found' 
      });
    }

    // Sort configuration
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const comments = await Comment.find({ blog: req.params.blogId })
      .populate('author', 'name email avatar bio')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalComments = await Comment.countDocuments({ blog: req.params.blogId });

    res.json({
      success: true,
      data: comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        hasNext: page * limit < totalComments,
        hasPrev: page > 1
      },
      blogInfo: {
        title: blog.title,
        totalComments: blog.commentsCount || 0
      }
    });
  } catch (error) {
    console.error('❌ Get comments error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid blog ID format' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create comment
// @route   POST /api/comments/:blogId
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { content, parentComment = null } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment must be less than 1000 characters' 
      });
    }

    // Check if blog exists and is published
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog post not found' 
      });
    }

    if (!blog.published) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot comment on unpublished blog' 
      });
    }

    // Validate parent comment if provided
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || parent.blog.toString() !== req.params.blogId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid parent comment' 
        });
      }
    }

    const comment = await Comment.create({
      content: content.trim(),
      blog: req.params.blogId,
      author: req.user.id,
      parentComment: parentComment || null
    });

    // Increment comments count on blog
    blog.commentsCount = (blog.commentsCount || 0) + 1;
    await blog.save();

    // Populate the new comment with author info
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar bio')
      .populate({
        path: 'parentComment',
        select: 'content author',
        populate: {
          path: 'author',
          select: 'name email avatar'
        }
      });

    console.log(`✅ New comment created by ${req.user.email} on blog: "${blog.title}"`);

    res.status(201).json({
      success: true,
      message: parentComment ? 'Reply posted successfully' : 'Comment posted successfully',
      data: populatedComment
    });
  } catch (error) {
    console.error('❌ Create comment error:', error);

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
      message: 'Server error while creating comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    // Check if user is comment owner, blog author, or admin
    const isCommentOwner = comment.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // Check if user is the blog author
    const blog = await Blog.findById(comment.blog);
    const isBlogAuthor = blog && blog.author.toString() === req.user.id;

    if (!isCommentOwner && !isAdmin && !isBlogAuthor) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this comment' 
      });
    }

    // Delete all replies to this comment (if it's a parent)
    const deletedReplies = await Comment.deleteMany({ parentComment: req.params.id });

    // Decrement comments count on blog
    if (blog) {
      const totalToDelete = 1 + deletedReplies.deletedCount; // parent + replies
      blog.commentsCount = Math.max(0, (blog.commentsCount || 0) - totalToDelete);
      await blog.save();
    }

    await Comment.findByIdAndDelete(req.params.id);

    console.log(`✅ Comment deleted by ${req.user.email}. Replies deleted: ${deletedReplies.deletedCount}`);

    res.json({
      success: true,
      message: `Comment and ${deletedReplies.deletedCount} replies deleted successfully`
    });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid comment ID format' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment must be less than 1000 characters' 
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    // Check if user is comment owner
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this comment' 
      });
    }

    // Check if comment is too old to edit (e.g., 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (comment.createdAt < oneHourAgo && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Comment can only be edited within 1 hour of posting' 
      });
    }

    comment.content = content.trim();
    comment.edited = true;
    comment.updatedAt = new Date();

    await comment.save();

    // Populate the updated comment
    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar bio');

    console.log(`✅ Comment updated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    console.error('❌ Update comment error:', error);

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
        message: 'Invalid comment ID format' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Like/Unlike comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    const hasLiked = comment.likes.includes(req.user.id);

    if (hasLiked) {
      // Unlike the comment
      comment.likes.pull(req.user.id);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Like the comment
      comment.likes.push(req.user.id);
      comment.likesCount += 1;
    }

    await comment.save();

    res.json({
      success: true,
      message: hasLiked ? 'Comment unliked' : 'Comment liked',
      data: {
        likesCount: comment.likesCount,
        hasLiked: !hasLiked
      }
    });
  } catch (error) {
    console.error('❌ Like comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid comment ID format' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get comment replies
// @route   GET /api/comments/:id/replies
// @access  Public
exports.getCommentReplies = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    const replies = await Comment.find({ parentComment: req.params.id })
      .populate('author', 'name email avatar bio')
      .sort({ createdAt: 1 }) // Oldest first for replies
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalReplies = await Comment.countDocuments({ parentComment: req.params.id });

    res.json({
      success: true,
      data: replies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReplies / limit),
        totalReplies,
        hasNext: page * limit < totalReplies,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get comment replies error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid comment ID format' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching replies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};