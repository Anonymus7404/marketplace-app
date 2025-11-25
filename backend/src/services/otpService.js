/**
 * OTP Service for Phone Verification
 * Professional OTP generation, storage and validation
 */

const redis = require('redis');
const otpGenerator = require('otp-generator');
const logger = require('../utils/logger');

// Redis client for OTP storage
const client = redis.createClient({
    socket: {
        host: '127.0.0.1',
        port: 6379,
    }
});

(async () => {
    try {
        await client.connect();
    } catch (err) {
    } finally {
        // redis.disconnect();
    }
})();

class OTPService {
    constructor() {
        this.OTP_EXPIRY = parseInt(process.env.OTP_EXPIRES_IN) || 600; // 10 minutes
        this.OTP_LENGTH = 6;
        this.MAX_ATTEMPTS = 3;
    }

    /**
     * Generate and send OTP to phone
     */
    async generateOTP(phone) {
        try {
            // Clean phone number
            const cleanPhone = phone.replace(/\D/g, '');

            // Generate OTP
            const otp = otpGenerator.generate(this.OTP_LENGTH, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false
            });

            // Store OTP in Redis with expiry and attempt count
            const otpKey = `otp:${cleanPhone}`;
            const otpData = {
                otp,
                attempts: 0,
                generatedAt: new Date().toISOString()
            };

            await client.setEx(otpKey, this.OTP_EXPIRY, JSON.stringify(otpData));

            // In production, integrate with SMS service like MSG91, Twilio, etc.
            logger.info(`📱 OTP for ${cleanPhone}: ${otp}`); // Remove this in production

            return {
                success: true,
                message: 'OTP sent successfully',
                otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only return OTP in development
            };
        } catch (error) {
            logger.error('OTP generation error:', error);
            throw new Error('Failed to generate OTP');
        }
    }

    /**
     * Verify OTP
     */
    async verifyOTP(phone, enteredOTP) {
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const otpKey = `otp:${cleanPhone}`;

            const otpData = await client.get(otpKey);

            if (!otpData) {
                return {
                    success: false,
                    message: 'OTP expired or not found'
                };
            }

            const { otp, attempts, generatedAt } = JSON.parse(otpData);

            // Check attempt limit
            if (attempts >= this.MAX_ATTEMPTS) {
                await client.del(otpKey);
                return {
                    success: false,
                    message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
                };
            }

            // Verify OTP
            if (otp !== enteredOTP) {
                // Increment attempt count
                const updatedData = {
                    otp,
                    attempts: attempts + 1,
                    generatedAt
                };
                await client.setEx(otpKey, this.OTP_EXPIRY, JSON.stringify(updatedData));

                return {
                    success: false,
                    message: 'Invalid OTP',
                    attemptsRemaining: this.MAX_ATTEMPTS - (attempts + 1)
                };
            }

            // OTP verified successfully - delete from Redis
            await client.del(otpKey);

            return {
                success: true,
                message: 'OTP verified successfully'
            };
        } catch (error) {
            logger.error('OTP verification error:', error);
            throw new Error('Failed to verify OTP');
        }
    }

    /**
     * Resend OTP
     */
    async resendOTP(phone) {
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const otpKey = `otp:${cleanPhone}`;

            // Delete existing OTP if any
            await client.del(otpKey);

            // Generate new OTP
            return await this.generateOTP(phone);
        } catch (error) {
            logger.error('OTP resend error:', error);
            throw new Error('Failed to resend OTP');
        }
    }
}

module.exports = new OTPService();