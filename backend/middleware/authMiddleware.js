const supabase = require('../supabaseClient');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[AUTH ERROR] Token verification failed:', error?.message || 'No user found');
      console.debug('[AUTH DEBUG] Token starts with:', token.substring(0, 10));
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        details: error?.message || 'Authentication service rejected the token.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = authMiddleware;
