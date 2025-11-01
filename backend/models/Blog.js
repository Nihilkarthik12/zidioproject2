const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
  },
  excerpt: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
    index: true,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 'Business', 'Education', 'Entertainment', 'Other'],
  },
  coverImage: {
    type: String,
    default: '',
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likesCount: {
    type: Number,
    default: 0,
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  published: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
blogSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create text index for search
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

module.exports = mongoose.model('Blog', blogSchema);
