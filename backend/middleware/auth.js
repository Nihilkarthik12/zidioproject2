const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

// Rate limiting middleware
const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.timestamp < windowStart) {
      rateLimitStore.delete(key);
    }
  }

  const userLimit = rateLimitStore.get(ip) || { count: 0, timestamp: now };

  if (userLimit.timestamp < windowStart) {
    // Reset counter for new window
    userLimit.count = 1;
    userLimit.timestamp = now;
  } else {
    userLimit.count += 1;
  }

  rateLimitStore.set(ip, userLimit);

  // Check if rate limit exceeded
  if (userLimit.count > MAX_REQUESTS) {
    const resetTime = new Date(userLimit.timestamp + RATE_LIMIT_WINDOW).toISOString();
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: resetTime
    });
  }

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS,
    'X-RateLimit-Remaining': MAX_REQUESTS - userLimit.count,
    'X-RateLimit-Reset': new Date(userLimit.timestamp + RATE_LIMIT_WINDOW).toISOString()
  });

  next();
};

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check multiple token sources
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log('❌ No token provided in request');
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No authentication token provided.' 
    });
  }

  console.log('🔍 Received token:', token.substring(0, 20) + '...');

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired (additional safety check)
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired. Please login again.' 
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User no longer exists. Please login again.' 
      });
    }

    // Check if user account is active
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Attach user to request
    req.user = user;
    
    // Log authentication success (for security monitoring)
    console.log(`🔐 Authenticated: ${user.email} (${user.role}) - ${req.method} ${req.originalUrl}`);

    next();
  } catch (error) {
    console.error('❌ JWT Verification Error:', error.message);

    // Specific error messages for different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authentication token.' 
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token has expired. Please login again.' 
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token not yet valid.' 
      });
    }

    // Generic error for other cases
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed. Please login again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin only middleware
exports.admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required before checking admin privileges.'
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
};

// Owner or admin middleware - check if user owns the resource or is admin
exports.ownerOrAdmin = (getOwnerId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    try {
      const ownerId = typeof getOwnerId === 'function' ? getOwnerId(req) : getOwnerId;
      const isOwner = ownerId && req.user._id.toString() === ownerId.toString();
      const isAdmin = req.user.role === 'admin';

      if (isOwner || isAdmin) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource owner id'
      });
    }
  };
};

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`🚫 Role access denied: ${req.user.email} (${req.user.role}) attempted ${req.method} ${req.originalUrl}. Required roles: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    console.log(`✅ Role access granted: ${req.user.email} (${req.user.role}) - ${req.method} ${req.originalUrl}`);
    next();
  };
};

// Apply rate limiting to authentication middleware
exports.rateLimit = rateLimit;

// Security headers middleware
exports.securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.set('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (should be configured at reverse proxy level in production)
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content security policy (basic)
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;");
  
  next();
};

// Request logging middleware (enhanced)
exports.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`${logLevel} ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  
  next();
};