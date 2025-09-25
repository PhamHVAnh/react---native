const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Add item to cart
exports.addItemToCart = async (req, res) => {
    const { KhachHangID, SanPhamID, SoLuong } = req.body;

    if (!KhachHangID || !SanPhamID) {
        return res.status(400).json({ message: "KhachHangID and SanPhamID are required." });
    }

    try {
        // Check if item already exists in cart for this user
        const existingCartItem = await db.query(
            'SELECT * FROM GioHang WHERE KhachHangID = ? AND SanPhamID = ?',
            [KhachHangID, SanPhamID]
        );

        if (existingCartItem.length > 0) {
            // Update quantity if item already exists
            const newSoLuong = existingCartItem[0].SoLuong + (SoLuong || 1);
            await db.query(
                'UPDATE GioHang SET SoLuong = ? WHERE GioHangID = ?',
                [newSoLuong, existingCartItem[0].GioHangID]
            );
            res.status(200).json({ message: "Cart item quantity updated.", GioHangID: existingCartItem[0].GioHangID, SoLuong: newSoLuong });
        } else {
            // Add new item to cart
            const gioHangID = uuidv4();
            const newCartItem = { GioHangID: gioHangID, KhachHangID, SanPhamID, SoLuong: SoLuong || 1 };
            await db.query('INSERT INTO GioHang SET ?', newCartItem);
            res.status(201).json({ message: "Item added to cart.", ...newCartItem });
        }
    } catch (err) {
        console.error("Error adding/updating cart item:", err);
        res.status(500).json({ message: "Failed to add/update item in cart.", error: err.message });
    }
};

// Get cart items for a user
exports.getCartItems = async (req, res) => {
    const { khachHangID } = req.params;

    if (!khachHangID) {
        return res.status(400).json({ message: "KhachHangID is required." });
    }

    try {
        const cartItems = await db.query(
            'SELECT gh.*, sp.TenSanPham, sp.HinhAnh, sp.GiaGoc, sp.GiamGia FROM GioHang gh JOIN SanPham sp ON gh.SanPhamID = sp.SanPhamID WHERE gh.KhachHangID = ?',
            [khachHangID]
        );
        res.status(200).json(cartItems);
    } catch (err) {
        console.error("Error fetching cart items:", err);
        res.status(500).json({ message: "Failed to fetch cart items.", error: err.message });
    }
};

// Update item quantity in cart
exports.updateCartItemQuantity = async (req, res) => {
    const { gioHangID } = req.params;
    const { SoLuong } = req.body;

    if (!SoLuong || SoLuong <= 0) {
        return res.status(400).json({ message: "SoLuong must be a positive number." });
    }

    try {
        const result = await db.query(
            'UPDATE GioHang SET SoLuong = ? WHERE GioHangID = ?',
            [SoLuong, gioHangID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cart item not found." });
        }
        res.status(200).json({ message: "Cart item quantity updated.", GioHangID: gioHangID, SoLuong });
    } catch (err) {
        console.error("Error updating cart item quantity:", err);
        res.status(500).json({ message: "Failed to update cart item quantity.", error: err.message });
    }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
    const { gioHangID } = req.params;

    try {
        const result = await db.query(
            'DELETE FROM GioHang WHERE GioHangID = ?',
            [gioHangID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cart item not found." });
        }
        res.status(200).json({ message: "Cart item removed." });
    } catch (err) {
        console.error("Error removing cart item:", err);
        res.status(500).json({ message: "Failed to remove cart item.", error: err.message });
    }
};