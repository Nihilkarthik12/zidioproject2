import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiHeart, FiMessageCircle, FiEye, FiClock, FiTag, FiRefreshCw } from 'react-icons/fi';
import { blogService } from '../services/blogService';
import { useAuth } from '../context/AuthContext';
import { useApiCall } from '../hooks/useApiCall';
import { toast } from 'react-toastify';

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const { user } = useAuth();
  const { loading, error, execute } = useApiCall();

  const categories = [
    'All',
    'Technology',
    'Lifestyle',
    'Travel',
    'Food',
    'Health',
    'Business',
    'Education',
    'Entertainment',
    'Other',
  ];

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, category, debouncedSearchTerm]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBlogs = async () => {
    const result = await execute(() => blogService.getBlogs({
      page: currentPage,
      limit: 9,
      ...(category !== 'All' && { category }),
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    }));

    if (result?.success) {
      setBlogs(result.data);
      setTotalPages(result.pagination?.totalPages || Math.ceil(result.total / 9));
      setTotalBlogs(result.total || result.pagination?.totalBlogs || 0);
    } else {
      toast.error(result?.message || 'Failed to load blogs');
    }
  };

  const handleLike = async (blogId) => {
    if (!user) {
      toast.info('Please login to like blogs');
      return;
    }

    const result = await execute(() => blogService.likeBlog(blogId));
    if (result?.success) {
      await fetchBlogs(); // Refresh the blogs to update like counts
      toast.success('Like updated!');
    } else {
      toast.error(result?.message || 'Failed to update like');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatReadTime = (content) => {
    if (!content || typeof content !== 'string') {
      return '1 min read'; // Default fallback
    }
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const handleRetry = () => {
    fetchBlogs();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Amazing Stories
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Share your thoughts, connect with readers, and build your audience
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm opacity-75">
            <div className="flex items-center space-x-2">
              <FiHeart className="w-5 h-5" />
              <span>{totalBlogs} Articles</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiMessageCircle className="w-5 h-5" />
              <span>Community Driven</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8 transition-colors duration-300">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-48">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-pulse transition-colors duration-300">
                <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-t-xl"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blogs Grid */}
        {!loading && blogs.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {blogs.map((blog) => (
                <article key={blog._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Cover Image */}
                  {blog.coverImage && (
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                  )}

                  <div className="p-6">
                    {/* Category & Tags */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        <FiTag className="w-3 h-3 mr-1" />
                        {blog.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <FiClock className="w-3 h-3 mr-1" />
                        {formatReadTime(blog.content)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2">
                      <Link to={`/blog/${blog._id}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {blog.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                      {blog.excerpt || blog.content.substring(0, 150) + '...'}
                    </p>

                    {/* Author and Date */}
                    <div className="flex items-center mb-4">
                      <img
                        src={`https://ui-avatars.com/api/?name=${blog.author.name}&background=0ea5e9&color=ffffff`}
                        alt={blog.author.name}
                        className="w-8 h-8 rounded-full mr-3 ring-2 ring-primary-200 dark:ring-primary-800"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{blog.author.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(blog.createdAt)}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(blog._id)}
                          className={`flex items-center space-x-1 transition-colors ${user && blog.likes.includes(user._id) ? 'text-red-500' : 'hover:text-red-500'}`}
                          disabled={!user}
                        >
                          <FiHeart className={user && blog.likes.includes(user._id) ? 'fill-current' : ''} />
                          <span>{blog.likesCount}</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <FiMessageCircle />
                          <span>{blog.commentsCount}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <FiEye />
                          <span>{blog.views}</span>
                        </div>
                      </div>

                      <Link
                        to={`/blog/${blog._id}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                      >
                        Read more →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].slice(Math.max(0, currentPage - 3), currentPage + 2).map((_, i) => {
                    const pageNum = i + Math.max(1, currentPage - 2);
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${currentPage === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && blogs.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No blogs found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || category !== 'All'
                ? 'Try adjusting your search or filter criteria.'
                : 'Be the first to share your story with the community.'}
            </p>
            {!searchTerm && category === 'All' && (
              <Link
                to="/create"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Write First Blog
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
