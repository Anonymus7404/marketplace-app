/**
 * Authentication Controller
 * Handles user registration, OTP, and login
 */

const otpService = require('../services/otpService');
const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Send OTP to phone number
   */
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;
      // Validate phone number
      if (!phone || phone.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Valid phone number is required'
        });
      }

      const result = await otpService.generateOTP(phone);

      res.json({
        success: true,
        message: 'OTP sent successfully',
        ...result
      });
    } catch (error) {
    //   logger.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify OTP and login/register user
   */
  async verifyOTP(req, res) {
    try {
      const { phone, otp, userData } = req.body;

      // Validate input
      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Phone and OTP are required'
        });
      }

      // Verify OTP
      const otpResult = await otpService.verifyOTP(phone, otp);
      
      if (!otpResult.success) {
        return res.status(400).json(otpResult);
      }

      let authResult;

      // Check if user exists
      const { User } = require('../../models');
      const existingUser = await User.findOne({ where: { phone } });

      if (existingUser) {
        // Login existing user
        authResult = await authService.loginUser(phone);
      } else {
        // Register new user
        if (!userData || !userData.name) {
          return res.status(400).json({
            success: false,
            error: 'Name is required for new user registration'
          });
        }

        authResult = await authService.registerUser({
          phone,
          name: userData.name,
          email: userData.email,
          user_type: userData.user_type
        });
      }

      res.json({
        success: true,
        message: 'Authentication successful',
        ...authResult
      });
    } catch (error) {
      logger.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      const result = await otpService.resendOTP(phone);

      res.json(result);
    } catch (error) {
      logger.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const user = await authService.getUserProfile(req.user.userId);

      res.json({
        success: true,
        user
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const user = await authService.updateUserProfile(req.user.userId, req.body);

      res.json({
        success: true,
        user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();