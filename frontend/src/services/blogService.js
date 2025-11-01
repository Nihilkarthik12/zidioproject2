import api from '../utils/api';

export const blogService = {
  // Get all blogs with filters
  getBlogs: async (params = {}) => {
    try {
      const response = await api.get('/blogs', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || {},
        total: response.data.total,
        totalPages: response.data.totalPages || response.data.pagination?.totalPages,
      };
    } catch (error) {
      console.error('Error fetching blogs:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to fetch blogs',
        error,
      };
    }
  },

  // Get single blog
  getBlog: async (id) => {
    try {
      const response = await api.get(`/blogs/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching blog:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to fetch blog',
        error,
      };
    }
  },

  // Create blog
  createBlog: async (blogData) => {
    try {
      const response = await api.post('/blogs', blogData);
      return {
        success: true,
        data: response.data.data,
        message: 'Blog created successfully!',
      };
    } catch (error) {
      console.error('Error creating blog:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to create blog',
        error,
      };
    }
  },

  // Update blog
  updateBlog: async (id, blogData) => {
    try {
      const response = await api.put(`/blogs/${id}`, blogData);
      return {
        success: true,
        data: response.data.data,
        message: 'Blog updated successfully!',
      };
    } catch (error) {
      console.error('Error updating blog:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to update blog',
        error,
      };
    }
  },

  // Delete blog
  deleteBlog: async (id) => {
    try {
      await api.delete(`/blogs/${id}`);
      return {
        success: true,
        message: 'Blog deleted successfully!',
      };
    } catch (error) {
      console.error('Error deleting blog:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to delete blog',
        error,
      };
    }
  },

  // Like/Unlike blog
  likeBlog: async (id) => {
    try {
      const response = await api.put(`/blogs/${id}/like`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error liking blog:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to like blog',
        error,
      };
    }
  },

  // Get user's blogs
  getUserBlogs: async (userId) => {
    try {
      const response = await api.get(`/blogs/user/${userId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching user blogs:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to fetch user blogs',
        error,
      };
    }
  },

  // Upload image
  uploadImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/blogs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // Longer timeout for file uploads
      });
      return {
        success: true,
        data: response.data.data,
        message: 'Image uploaded successfully!',
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to upload image',
        error,
      };
    }
  },
};

export const commentService = {
  // Get comments for a blog
  getComments: async (blogId) => {
    try {
      const response = await api.get(`/comments/${blogId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to fetch comments',
        error,
      };
    }
  },

  // Create comment
  createComment: async (blogId, content) => {
    try {
      const response = await api.post(`/comments/${blogId}`, { content });
      return {
        success: true,
        data: response.data.data,
        message: 'Comment added successfully!',
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to add comment',
        error,
      };
    }
  },

  // Delete comment
  deleteComment: async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      return {
        success: true,
        message: 'Comment deleted successfully!',
      };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to delete comment',
        error,
      };
    }
  },
};

export const adminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to fetch dashboard stats',
        error,
      };
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to fetch users',
        error,
      };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      return {
        success: true,
        message: 'User deleted successfully!',
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to delete user',
        error,
      };
    }
  },

  // Get all blogs
  getAllBlogs: async () => {
    try {
      const response = await api.get('/admin/blogs');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching admin blogs:', error);
      return {
        success: false,
        message: error.userMessage || 'Failed to fetch blogs',
        error,
      };
    }
  },
};
