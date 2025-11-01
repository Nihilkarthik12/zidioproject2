import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit, FiSettings } from 'react-icons/fi';
import { blogService } from '../services/blogService';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [userBlogs, setUserBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserBlogs = async () => {
    if (!user) return;

    try {
      const response = await blogService.getUserBlogs(user._id);
      if (response.success) {
        setUserBlogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching user blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your profile</h2>
          <Link to="/login" className="text-primary-600 hover:text-primary-700">
            Login here
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-center space-x-6">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0ea5e9&color=ffffff&size=128`}
            alt={user.name}
            className="w-24 h-24 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h1>
            <p className="text-gray-600 mb-2">{user.email}</p>
            {user.bio && <p className="text-gray-700">{user.bio}</p>}
            <div className="flex items-center space-x-4 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role}
              </span>
              <Link
                to="/settings"
                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
              >
                <FiSettings className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* User's Blogs */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Blogs</h2>
          <Link
            to="/create"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create New Blog
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : userBlogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs yet</h3>
            <p className="text-gray-600 mb-4">
              Start sharing your thoughts and ideas with the world.
            </p>
            <Link
              to="/create"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Write Your First Blog
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {userBlogs.map((blog) => (
              <div key={blog._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-block bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
                        {blog.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        blog.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link to={`/blog/${blog._id}`} className="hover:text-primary-600 transition-colors">
                        {blog.title}
                      </Link>
                    </h3>

                    {blog.excerpt && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatDate(blog.createdAt)}</span>
                      <span>{blog.likesCount} likes</span>
                      <span>{blog.commentsCount} comments</span>
                      <span>{blog.views} views</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/edit/${blog._id}`}
                      className="flex items-center space-x-1 text-gray-600 hover:text-primary-600"
                    >
                      <FiEdit className="w-4 h-4" />
                      <span className="text-sm">Edit</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
