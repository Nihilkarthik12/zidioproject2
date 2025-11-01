import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiEdit, FiTrash2, FiSend } from 'react-icons/fi';
import { blogService, commentService } from '../services/blogService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const response = await blogService.getBlog(id);
      if (response.success) {
        setBlog(response.data);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentService.getComments(id);
      if (response.success) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like blogs');
      return;
    }

    try {
      await blogService.likeBlog(id);
      fetchBlog(); // Refresh blog to update like count and status
    } catch (error) {
      console.error('Error liking blog:', error);
      toast.error('Failed to like blog');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingComment(true);

    try {
      const response = await commentService.createComment(id, commentText);
      if (response.success) {
        setComments([...comments, response.data]);
        setCommentText('');
        fetchBlog(); // Refresh blog to update comment count
        toast.success('Comment added successfully!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentService.deleteComment(commentId);
      setComments(comments.filter(comment => comment._id !== commentId));
      fetchBlog(); // Refresh blog to update comment count
      toast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
          <div className="h-64 bg-gray-300 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isLiked = user && blog.likes.includes(user._id);
  const isAuthor = user && blog.author._id === user._id;

  return (
    <div className="max-w-4xl mx-auto">
      <article className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Cover Image */}
        {blog.coverImage && (
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-64 md:h-80 object-cover"
          />
        )}

        <div className="p-8">
          {/* Category and Actions */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
              {blog.category}
            </span>

            {isAuthor && (
              <div className="flex space-x-2">
                <Link
                  to={`/edit/${blog._id}`}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600"
                >
                  <FiEdit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </Link>
                <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600">
                  <FiTrash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {blog.title}
          </h1>

          {/* Author and Meta */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <img
                src={`https://ui-avatars.com/api/?name=${blog.author.name}&background=0ea5e9&color=ffffff`}
                alt={blog.author.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900">{blog.author.name}</p>
                <p className="text-sm text-gray-500">{formatDate(blog.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <FiHeart className={isLiked ? 'fill-current text-red-500' : ''} />
                <span>{blog.likesCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiMessageCircle />
                <span>{blog.commentsCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>{blog.views} views</span>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-lg text-gray-600 mb-6 italic">
              {blog.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Like Button */}
          <div className="border-t pt-6 mb-8">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <FiHeart className={isLiked ? 'fill-current' : ''} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Comments ({blog.commentsCount})
            </h3>

            {/* Add Comment */}
            {isAuthenticated && (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex space-x-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=0ea5e9&color=ffffff`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiSend className="w-4 h-4" />
                        <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${comment.author.name}&background=0ea5e9&color=ffffff`}
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{comment.author.name}</p>
                            <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                          </div>
                          {(user && (comment.author._id === user._id || user.role === 'admin')) && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogDetail;
