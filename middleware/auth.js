const config = require('config');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.header('x-auth-token');

  // check for token
  // ensure to return from function to avoid resending headers
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    // verify token
    const decoded = jwt.verify(token, config.get('JWT_SECRET'));

    // add user from payload
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Invalid token' });
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    },
    config.get('JWT_SECRET'),
    { expiresIn: 3600 * 7 }
  );
}

function adminOnly(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token provided' });
  try {
    const decoded = jwt.verify(token, config.get('JWT_SECRET'));
    req.user = decoded;
    if (!req.user.isAdmin) return res.status(401).json({ msg: 'Admin only' });
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Invalid token' });
  }
}

module.exports = { auth, adminOnly, generateToken };
