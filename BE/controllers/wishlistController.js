const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Thêm sản phẩm vào wishlist
const addToWishlist = async (req, res) => {
  try {
    const { KhachHangID, SanPhamID } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!KhachHangID || !SanPhamID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin KhachHangID hoặc SanPhamID'
      });
    }

    // Kiểm tra xem sản phẩm đã có trong wishlist chưa
    const checkQuery = `
      SELECT YeuThichID FROM YeuThich 
      WHERE KhachHangID = ? AND SanPhamID = ?
    `;
    
    const existingItems = await db.query(checkQuery, [KhachHangID, SanPhamID]);
    
    if (existingItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm đã có trong danh sách yêu thích'
      });
    }

    // Kiểm tra xem khách hàng có tồn tại không
    const checkCustomerQuery = 'SELECT UserID FROM NguoiDung WHERE UserID = ? AND VaiTro = "KhachHang"';
    const customerExists = await db.query(checkCustomerQuery, [KhachHangID]);
    
    if (customerExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    // Kiểm tra xem sản phẩm có tồn tại không
    const checkProductQuery = 'SELECT SanPhamID FROM SanPham WHERE SanPhamID = ?';
    const productExists = await db.query(checkProductQuery, [SanPhamID]);
    
    if (productExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Thêm vào wishlist
    const yeuThichID = uuidv4();
    const insertQuery = `
      INSERT INTO YeuThich (YeuThichID, KhachHangID, SanPhamID, NgayTao)
      VALUES (?, ?, ?, NOW())
    `;
    
    await db.query(insertQuery, [yeuThichID, KhachHangID, SanPhamID]);

    res.status(200).json({
      success: true,
      message: 'Đã thêm sản phẩm vào danh sách yêu thích',
      data: {
        YeuThichID: yeuThichID,
        KhachHangID,
        SanPhamID
      }
    });

  } catch (error) {
    console.error('Lỗi thêm wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm vào wishlist',
      error: error.message
    });
  }
};

// Lấy danh sách wishlist của khách hàng
const getWishlistItems = async (req, res) => {
  try {
    const { khachHangID } = req.params;

    if (!khachHangID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu KhachHangID'
      });
    }

    const query = `
      SELECT 
        y.YeuThichID,
        y.KhachHangID,
        y.SanPhamID,
        y.NgayTao,
        sp.TenSanPham,
        sp.Model,
        sp.ThuongHieu,
        sp.GiaGoc,
        sp.GiamGia,
        sp.HinhAnh,
        sp.MoTa,
        dm.TenDanhMuc
      FROM YeuThich y
      JOIN SanPham sp ON y.SanPhamID = sp.SanPhamID
      LEFT JOIN DanhMuc dm ON sp.DanhMucID = dm.DanhMucID
      WHERE y.KhachHangID = ?
      ORDER BY y.NgayTao DESC
    `;

    const wishlistItems = await db.query(query, [khachHangID]);

    // Xử lý hình ảnh sản phẩm
    const processedItems = wishlistItems.map(item => {
      let hinhAnh = [];
      
      if (item.HinhAnh) {
        // Kiểm tra xem HinhAnh có phải là JSON string không
        if (typeof item.HinhAnh === 'string') {
          // Nếu bắt đầu bằng [ hoặc { thì coi như JSON
          if (item.HinhAnh.trim().startsWith('[') || item.HinhAnh.trim().startsWith('{')) {
            try {
              hinhAnh = JSON.parse(item.HinhAnh);
              // Đảm bảo là array
              if (!Array.isArray(hinhAnh)) {
                hinhAnh = [hinhAnh];
              }
            } catch (error) {
              // Nếu parse lỗi, coi như string đơn
              hinhAnh = [item.HinhAnh];
            }
          } else {
            // Không phải JSON, coi như string đơn
            hinhAnh = [item.HinhAnh];
          }
        } else if (Array.isArray(item.HinhAnh)) {
          hinhAnh = item.HinhAnh;
        } else {
          hinhAnh = [item.HinhAnh];
        }
      }
      
      // Tính giá hiện tại
      let giaHienTai = item.GiaGoc;
      if (item.GiamGia && item.GiamGia > 0) {
        // Nếu GiamGia là số tiền giảm trực tiếp (số lớn)
        if (item.GiamGia >= 1000) {
          giaHienTai = item.GiaGoc - item.GiamGia;
        } else {
          // Nếu GiamGia là phần trăm (0-100)
          giaHienTai = item.GiaGoc * (1 - item.GiamGia / 100);
        }
      }
      
      return {
        ...item,
        HinhAnh: hinhAnh,
        GiaHienTai: Math.max(0, Math.round(giaHienTai))
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách wishlist thành công',
      data: processedItems,
      total: processedItems.length
    });

  } catch (error) {
    console.error('Lỗi lấy wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách wishlist',
      error: error.message
    });
  }
};

// Kiểm tra trạng thái wishlist của sản phẩm
const checkWishlistStatus = async (req, res) => {
  try {
    const { khachHangID, sanPhamID } = req.params;

    if (!khachHangID || !sanPhamID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu KhachHangID hoặc SanPhamID'
      });
    }

    const query = `
      SELECT YeuThichID FROM YeuThich 
      WHERE KhachHangID = ? AND SanPhamID = ?
    `;

    const result = await db.query(query, [khachHangID, sanPhamID]);

    res.status(200).json({
      success: true,
      data: {
        isInWishlist: result.length > 0,
        yeuThichID: result.length > 0 ? result[0].YeuThichID : null
      }
    });

  } catch (error) {
    console.error('Lỗi kiểm tra wishlist status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra trạng thái wishlist',
      error: error.message
    });
  }
};

// Xóa sản phẩm khỏi wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { yeuThichID } = req.params;

    if (!yeuThichID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu YeuThichID'
      });
    }

    // Kiểm tra xem item có tồn tại không
    const checkQuery = 'SELECT YeuThichID FROM YeuThich WHERE YeuThichID = ?';
    const existingItem = await db.query(checkQuery, [yeuThichID]);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy item trong wishlist'
      });
    }

    // Xóa khỏi wishlist
    const deleteQuery = 'DELETE FROM YeuThich WHERE YeuThichID = ?';
    await db.query(deleteQuery, [yeuThichID]);

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích'
    });

  } catch (error) {
    console.error('Lỗi xóa wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa khỏi wishlist',
      error: error.message
    });
  }
};

// Xóa tất cả wishlist của khách hàng
const clearWishlist = async (req, res) => {
  try {
    const { khachHangID } = req.params;

    if (!khachHangID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu KhachHangID'
      });
    }

    // Xóa tất cả wishlist của khách hàng
    const deleteQuery = 'DELETE FROM YeuThich WHERE KhachHangID = ?';
    const result = await db.query(deleteQuery, [khachHangID]);

    res.status(200).json({
      success: true,
      message: 'Đã xóa tất cả sản phẩm khỏi danh sách yêu thích',
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Lỗi xóa tất cả wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa tất cả wishlist',
      error: error.message
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlistItems,
  checkWishlistStatus,
  removeFromWishlist,
  clearWishlist
};
