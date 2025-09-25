const jwt = require('jsonwebtoken');
const db = require('../db'); // Import the database connection

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Query the database to find the user
      db.query('SELECT UserID, HoTen, TenDangNhap, Email, SoDienThoai, DiaChi, VaiTro, NgayTao, HinhAnh FROM NguoiDung WHERE UserID = ?', [decoded.UserID], (err, results) => {
        if (err) {
          console.error('Database error in authMiddleware (user retrieval):', err);
          return res.status(500).json({ message: 'Server error' });
        }
        if (results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        req.user = results[0]; // Attach user to the request object
        next();
      });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };