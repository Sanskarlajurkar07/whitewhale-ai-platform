// utils/logger.js - Structured Logging System

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  _log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // In production, output JSON for log aggregation
    if (this.isProduction) {
      console.log(JSON.stringify(logEntry));
    } else {
      // In development, pretty print
      const emoji = {
        ERROR: '❌',
        WARN: '⚠️ ',
        INFO: 'ℹ️ ',
        DEBUG: '🔍'
      }[level] || '';
      
      console.log(`${emoji} [${timestamp}] ${level}: ${message}`, meta);
    }
  }

  error(message, meta = {}) {
    this._log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this._log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this._log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (!this.isProduction) {
      this._log(LOG_LEVELS.DEBUG, message, meta);
    }
  }

  // HTTP request logger
  logRequest(req, duration = 0) {
    this.info('HTTP Request', {
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      duration: `${duration}ms`,
      ip: req.ip
    });
  }

  // API call logger
  logApiCall(provider, model, duration, success) {
    this.info('External API Call', {
      provider,
      model,
      duration: `${duration}ms`,
      success
    });
  }
}

module.exports = new Logger();
