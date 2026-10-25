const User = require('../models/User');
const Student = require('../models/Student');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog, createNotification } = require('../utils/helpers');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role — public registration only for students
    const allowedPublicRoles = ['student'];
    const userRole = role && allowedPublicRoles.includes(role) ? role : 'student';

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
    });

    // Create student profile if student
    if (userRole === 'student') {
      await Student.create({ userId: user._id });
    }

    // Create audit log
    await createAuditLog({
      userId: user._id,
      action: 'STUDENT_REGISTERED',
      entityType: 'user',
      entityId: user._id,
      newStatus: 'active',
      remarks: `New ${userRole} registered`,
      ipAddress: req.ip,
    });

    // Send welcome notification
    await createNotification(
      user._id,
      'Welcome to ScholarFlow!',
      `Hello ${name}! Your account has been created successfully. Complete your profile to start applying for scholarships.`,
      'GENERAL'
    );

    const token = user.getSignedJwtToken();

    sendSuccess(
      res,
      'Registration successful',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Contact administrator.', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Audit log
    await createAuditLog({
      userId: user._id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user._id,
      ipAddress: req.ip,
    });

    const token = user.getSignedJwtToken();

    sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    let profileData = null;
    if (user.role === 'student') {
      profileData = await Student.findOne({ userId: user._id });
    }

    sendSuccess(res, 'User profile retrieved', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      profile: profileData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await createAuditLog({
      userId: req.user._id,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: req.user._id,
      ipAddress: req.ip,
    });

    sendSuccess(res, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout };
