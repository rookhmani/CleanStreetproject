const mongoose = require('mongoose');

const withDefaultDatabase = (uri) => {
  const defaultDbName = process.env.MONGODB_DB_NAME || 'cleanstreet_db';

  if (!uri || !uri.startsWith('mongodb')) {
    return uri;
  }

  try {
    const parsed = new URL(uri);
    const dbInPath = parsed.pathname && parsed.pathname !== '/';

    if (!dbInPath) {
      parsed.pathname = `/${defaultDbName}`;
    }

    return parsed.toString();
  } catch (error) {
    return uri;
  }
};

const connectDatabase = async () => {
  const primaryUri = withDefaultDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleanstreet_db');
  const fallbackUri = withDefaultDatabase(process.env.MONGODB_FALLBACK_URI);

  try {
    await mongoose.connect(primaryUri);
    return { usedFallback: false };
  } catch (error) {
    if (!fallbackUri || fallbackUri === primaryUri) {
      throw error;
    }

    console.warn('MongoDB primary connection failed, trying fallback URI:', error.message);
    await mongoose.connect(fallbackUri);
    return { usedFallback: true };
  }
};

module.exports = connectDatabase;
