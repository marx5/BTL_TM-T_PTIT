const jwt = require('jsonwebtoken');
// const TokenBlacklist = require('../models/TokenBlacklist');
const User = require('../models/User');
const AppError = require('../utils/appError');

const auth = async (req, res, next) => {
  try {
    // Debug logging
    console.log('Request headers:', req.headers);
    console.log('Authorization header:', req.headers.authorization);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No auth header found');
      throw new AppError('no_token_provided', 401);
    }

    // Check Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      console.log('Invalid token format');
      throw new AppError('invalid_token_format', 401);
    }

    const token = parts[1];
    console.log('Token found:', token);
    
    // // Check if token is blacklisted
    // const blacklisted = await TokenBlacklist.findOne({ where: { token } });
    // if (blacklisted) {
    //   console.log('Token is blacklisted');
    //   throw new AppError('token_blacklisted', 401);
    // }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // Get user with role
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role']
    });
    
    if (!user) {
      console.log('User not found for token');
      throw new AppError('user_not_found', 401);
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.log('Auth error:', err);
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('invalid_token', 401));
    } else {
      next(err);
    }
  }
};

const adminAuth = async (req, res, next) => {
  try {
    console.log('Checking admin role for user:', req.user);
    if (!req.user || req.user.role !== 'admin') {
      console.log('User is not admin:', req.user?.role);
      throw new AppError('admin_access_required', 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { auth, adminAuth };