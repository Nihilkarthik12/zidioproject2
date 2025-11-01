# Blogging Platform

A full-stack blogging platform built with Node.js, Express.js, MongoDB, and React.js. Features include user authentication, blog CRUD operations, comments, likes, search, and an admin dashboard.

## Features

- ✅ User authentication (registration, login)
- ✅ Blog creation, editing, and deletion
- ✅ Rich text editor with React Quill
- ✅ Comments and likes system
- ✅ Search and category filtering
- ✅ User profiles with authored blogs
- ✅ Admin dashboard with statistics
- ✅ Image upload with Cloudinary
- ✅ Responsive design with Tailwind CSS

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Cloudinary for image storage
- Multer for file uploads

### Frontend
- React.js
- React Router for navigation
- React Quill for rich text editing
- Tailwind CSS for styling
- Axios for API calls
- React Toastify for notifications

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Cloudinary account (for image uploads)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/blogging-platform
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   JWT_EXPIRE=7d

   # Cloudinary Configuration (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. Start MongoDB (if using local MongoDB)

6. Start the backend server:
   ```bash
   npm run dev
   ```

   The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Blogs
- `GET /api/blogs` - Get all blogs (with search and filter)
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create blog (protected)
- `PUT /api/blogs/:id` - Update blog (protected)
- `DELETE /api/blogs/:id` - Delete blog (protected)
- `PUT /api/blogs/:id/like` - Like/unlike blog (protected)
- `GET /api/blogs/user/:userId` - Get user's blogs
- `POST /api/blogs/upload` - Upload image (protected)

### Comments
- `GET /api/comments/:blogId` - Get comments for blog
- `POST /api/comments/:blogId` - Create comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/blogs` - Get all blogs (admin only)
- `GET /api/admin/stats` - Get dashboard stats (admin only)

## Usage

1. Register a new account or login with existing credentials
2. Create your first blog post using the rich text editor
3. Browse and search other blogs on the platform
4. Like and comment on blogs
5. View your profile and manage your blogs
6. Admin users can access the dashboard to view statistics

## Project Structure

```
blogging-platform/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── blogController.js
│   │   ├── commentController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Blog.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── blogRoutes.js
│   │   ├── commentRoutes.js
│   │   └── adminRoutes.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── Footer.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── CreateBlog.js
    │   │   ├── BlogDetail.js
    │   │   ├── Profile.js
    │   │   └── AdminDashboard.js
    │   ├── services/
    │   │   └── blogService.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
