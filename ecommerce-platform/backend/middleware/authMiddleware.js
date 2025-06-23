const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as necessary
const { promisify } = require('util'); // Standard Node.js utility

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) { // Check for token in cookies
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist.'
      });
    }

    // 4) Check if user changed password after the token was issued
    // (This requires a passwordChangedAt field in the User model, which we can add later if needed)
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return res.status(401).json({
    //     status: 'fail',
    //     message: 'User recently changed password! Please log in again.'
    //   });
    // }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser; // Attach user to the request object
    res.locals.user = currentUser; // Also make it available in templates if using server-side rendering
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again!' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'fail', message: 'Your token has expired! Please log in again.' });
    }
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong in the authentication middleware.' });
  }
};

// Authorization (role-based)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array like ['admin', 'lead-guide']. req.user.role is set by the protect middleware.
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ // 403 Forbidden
        status: 'fail',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Middleware to optionally load user if token is present, but doesn't fail if not.
// Useful for endpoints that behave differently for logged-in vs anonymous users.
exports.softProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (token && token !== 'loggedout') { // Check for 'loggedout' or other placeholder values
      // Verification token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (currentUser) {
        // Grant access to req.user
        req.user = currentUser;
        res.locals.user = currentUser;
      }
    }
  } catch (error) {
    // If token is invalid or expired, just don't set req.user. Don't throw error.
    // console.log("Soft protect: Could not verify token, proceeding as anonymous.", error.name);
  }
  next();
};
