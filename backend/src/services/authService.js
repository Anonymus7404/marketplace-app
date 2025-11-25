/**
 * Authentication Service
 * JWT token management and user authentication
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      phone: user.phone,
      userType: user.user_type,
      isVerified: user.is_verified
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error('JWT verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Register new user
   */
  async registerUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { phone: userData.phone }
      });

      if (existingUser) {
        throw new Error('User already exists with this phone number');
      }

      // Create new user
      const user = await User.create({
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        user_type: userData.user_type || 'customer',
        is_verified: false,
        kyc_status: 'not_submitted'
      });

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'User registered successfully'
      };
    } catch (error) {
      logger.error('User registration error:', error);
      throw error;
    }
  }

  /**
   * Login user (after OTP verification)
   */
  async loginUser(phone) {
    try {
      // Find user by phone
      const user = await User.findOne({
        where: { phone }
      });

      if (!user) {
        throw new Error('User not found. Please register first.');
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'Login successful'
      };
    } catch (error) {
      logger.error('User login error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Remove fields that shouldn't be updated
      const { id, phone, user_type, ...allowedUpdates } = updateData;
      
      await user.update(allowedUpdates);

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Update user profile error:', error);
      throw error;
    }
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    const userObj = user.toJSON ? user.toJSON() : user;
    const { deletedAt, ...sanitized } = userObj;
    return sanitized;
  }
}

module.exports = new AuthService();