/**
 * Professional Logger Utility
 * Structured logging for different environments
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: getTimestamp(),
      message,
      ...meta
    }));
  },

  error: (message, error = null, meta = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: getTimestamp(),
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        ...(error.code && { code: error.code })
      } : undefined,
      ...meta
    }));
  },

  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: getTimestamp(),
      message,
      ...meta
    }));
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        timestamp: getTimestamp(),
        message,
        ...meta
      }));
    }
  }
};

module.exports = logger;