const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is used for password hashing

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ UserID: id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM NguoiDung');
        res.json(results);
    } catch (err) {
        console.error("Error getting all users:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const results = await db.query('SELECT * FROM NguoiDung WHERE UserID = ?', [id]);
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }
        res.json(results[0]);
    } catch (err) {
        console.error("Error getting user by ID:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Create a new user
exports.createUser = async (req, res) => {
    const userId = uuidv4(); // Generate UUID for UserID

    // Define default values
    const defaultUser = {
        UserID: userId,
        HoTen: '',
        Email: '',
        SoDienThoai: '',
        DiaChi: '',
        VaiTro: 'KhachHang',
        HinhAnh: '', // TEXT column, chuỗi rỗng
        NgayTao: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        TenDangNhap: '',
        MatKhau: ''
    };

    // Merge frontend data
    const newUser = { ...defaultUser, ...req.body };

    // Hash password if provided
    if (newUser.MatKhau) {
        const salt = await bcrypt.genSalt(10);
        newUser.MatKhau = await bcrypt.hash(newUser.MatKhau, salt);
    }

    try {
        await db.query('INSERT INTO NguoiDung SET ?', newUser);
        // Return the created user (without password)
        const { MatKhau: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { HoTen, TenDangNhap, MatKhau, Email, SoDienThoai, DiaChi, HinhAnh, VaiTro } = req.body;

    try {
        const results = await db.query('SELECT * FROM NguoiDung WHERE UserID = ?', [id]);
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const existingUser = results[0];

        // Only update fields that are provided in request body
        const updateFields = {};
        
        if (HoTen !== undefined) updateFields.HoTen = HoTen;
        if (TenDangNhap !== undefined) updateFields.TenDangNhap = TenDangNhap;
        if (Email !== undefined) updateFields.Email = Email;
        if (SoDienThoai !== undefined) updateFields.SoDienThoai = SoDienThoai;
        if (DiaChi !== undefined) updateFields.DiaChi = DiaChi;
        if (HinhAnh !== undefined) updateFields.HinhAnh = HinhAnh;
        if (VaiTro !== undefined) updateFields.VaiTro = VaiTro;
        
        // Handle password separately - only update if new password provided
        if (MatKhau) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(MatKhau, salt);
            updateFields.MatKhau = hashedPassword;
        }
        
        console.log('Update fields:', updateFields);
        
        // Check if there are fields to update
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const updateResults = await db.query('UPDATE NguoiDung SET ? WHERE UserID = ?', [updateFields, id]);
        if (updateResults.affectedRows === 0) {
            return res.status(404).send('User not found or no changes made');
        }

        const finalUserResults = await db.query('SELECT UserID, HoTen, TenDangNhap, Email, SoDienThoai, DiaChi, HinhAnh, VaiTro, NgayTao FROM NguoiDung WHERE UserID = ?', [id]);
        res.json(finalUserResults[0]);

    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Internal Server Error');
    }
};

// Login a user
exports.loginUser = async (req, res) => {
    const { TenDangNhap, MatKhau } = req.body;
    if (!TenDangNhap || !MatKhau) {
        return res.status(400).send('Tên đăng nhập và mật khẩu là bắt buộc');
    }

    try {
        const results = await db.query('SELECT * FROM NguoiDung WHERE TenDangNhap = ?', [TenDangNhap]);
        if (results.length === 0) {
            return res.status(401).send('Tên đăng nhập không tồn tại');
        }

        const user = results[0];

        // Compare provided password with hashed password
        const isMatch = await bcrypt.compare(MatKhau, user.MatKhau);
        if (!isMatch) {
            return res.status(401).send('Mật khẩu không chính xác');
        }

        const { MatKhau: _, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            token: generateToken(user.UserID),
        });
    } catch (err) {
        console.error("Error logging in user:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Get current user profile
exports.getMe = (req, res) => {
    // Assuming authMiddleware has already populated req.user
    if (!req.user) {
        return res.status(401).send('Not authenticated');
    }
    res.json(req.user);
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const results = await db.query('DELETE FROM NguoiDung WHERE UserID = ?', [id]);
        if (results.affectedRows === 0) {
            return res.status(404).send('User not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).send('Internal Server Error');
    }
};
