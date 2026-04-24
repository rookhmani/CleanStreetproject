const parseList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const getClientUrl = () =>
  (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const getAdminClientUrl = () =>
  (process.env.ADMIN_CLIENT_URL || process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001').replace(/\/$/, '');

const getAllowedOrigins = () => {
  const configuredOrigins = parseList(process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS);
  const origins = [
    ...configuredOrigins,
    getClientUrl(),
    getAdminClientUrl()
  ];

  return [...new Set(origins)];
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (getAllowedOrigins().includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
};

const validateRequiredEnv = () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = ['JWT_SECRET', 'MONGODB_URI'].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  corsOptions,
  getAllowedOrigins,
  getAdminClientUrl,
  getClientUrl,
  validateRequiredEnv
};
