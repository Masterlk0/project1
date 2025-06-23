const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Utility to sign JWT
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Utility to create and send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // days * hours * minutes * seconds * milliseconds
    ),
    httpOnly: true // Cookie cannot be accessed or modified by the browser
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // Only send over HTTPS

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirm, role, firstName, lastName, phoneNumber, address } = req.body;

    // 1) Validate basic fields
    if (!username || !email || !password || !passwordConfirm || !role) {
      return res.status(400).json({ status: 'fail', message: 'Please provide username, email, password, password confirmation, and role.' });
    }

    // 2) Check if passwords match
    if (password !== passwordConfirm) {
      return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
    }

    // 3) Validate email format
    if (!validator.isEmail(email)) {
        return res.status(400).json({ status: 'fail', message: 'Please provide a valid email address.' });
    }

    // 4) Validate role
    if (!['buyer', 'seller'].includes(role)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid role specified. Must be "buyer" or "seller".' });
    }

    // 5) Check if user already exists (by email or username)
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ status: 'fail', message: 'User with this email already exists.' });
    }
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ status: 'fail', message: 'User with this username already exists.' });
    }

    // 6) Create new user
    const newUser = await User.create({
      username,
      email,
      password, // Password will be hashed by pre-save middleware in User model
      role,
      firstName,
      lastName,
      phoneNumber,
      address
    });

    // 7) Send token to client
    createSendToken(newUser, 201, res);

  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join('. ')
      });
    }
    console.error("Registration Error:", error);
    res.status(500).json({ status: 'error', message: 'Something went wrong during registration.' });
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ status: 'error', message: 'Something went wrong during login.' });
  }
};
