const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.getAllKhuyenMais = async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM KhuyenMai ORDER BY NgayKetThuc ASC');
        res.json(results);
    } catch (error) {
        console.error('Database error in getAllKhuyenMais:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách khuyến mãi' });
    }
};

// Lấy khuyến mãi còn hiệu lực
exports.getActivePromotions = async (req, res) => {
    try {
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const query = `
            SELECT * FROM KhuyenMai 
            WHERE NgayBatDau <= ? 
            AND NgayKetThuc >= ?
            AND (GioiHanSuDung > 0 OR GioiHanSuDung IS NULL)
            ORDER BY NgayKetThuc ASC
        `;
        
        const results = await db.query(query, [currentDate, currentDate]);
        res.json(results);
    } catch (error) {
        console.error('Database error in getActivePromotions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách khuyến mãi',
            error: error.message 
        });
    }
};

exports.getKhuyenMaiById = async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM KhuyenMai WHERE KhuyenMaiID = ?', [req.params.id]);
        if (results.length === 0) {
            res.status(404).json({ error: 'Không tìm thấy mã khuyến mãi' });
        } else {
            res.json(results[0]);
        }
    } catch (error) {
        console.error('Database error in getKhuyenMaiById:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thông tin khuyến mãi' });
    }
};

exports.createKhuyenMai = async (req, res) => {
    try {
        console.log('➕ Creating new promotion with data:', req.body);
        
        const khuyenMaiId = uuidv4(); // Generate UUID for KhuyenMaiID
        let promotionData = req.body;
        if (Array.isArray(promotionData) && promotionData.length > 0) {
            promotionData = promotionData[0];
        }
        const newKhuyenMai = { KhuyenMaiID: khuyenMaiId, ...promotionData }; // Add KhuyenMaiID to the body
        
        await db.query('INSERT INTO KhuyenMai SET ?', newKhuyenMai);
        
        console.log('✅ Promotion created successfully:', khuyenMaiId);
        res.status(201).json({ KhuyenMaiID: khuyenMaiId, ...newKhuyenMai }); // Return generated KhuyenMaiID
    } catch (error) {
        console.error('❌ Database error creating promotion:', error);
        res.status(500).json({ error: error.message });
    }
};


exports.updateKhuyenMai = async (req, res) => {
    try {
        console.log('🔄 Updating promotion:', req.params.id, 'with data:', req.body);
        
        const results = await db.query('UPDATE KhuyenMai SET ? WHERE KhuyenMaiID = ?', [req.body, req.params.id]);
        
        if (results.affectedRows === 0) {
            console.log('⚠️ Promotion not found:', req.params.id);
            return res.status(404).json({ error: 'KhuyenMai not found' });
        }
        
        console.log('✅ Promotion updated successfully');
        res.json({ KhuyenMaiID: req.params.id, ...req.body });
    } catch (error) {
        console.error('❌ Database error updating promotion:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteKhuyenMai = async (req, res) => {
    try {
        console.log('🗑️ Deleting promotion:', req.params.id);
        
        const results = await db.query('DELETE FROM KhuyenMai WHERE KhuyenMaiID = ?', [req.params.id]);
        
        if (results.affectedRows === 0) {
            console.log('⚠️ Promotion not found:', req.params.id);
            return res.status(404).json({ error: 'KhuyenMai not found' });
        }
        
        console.log('✅ Promotion deleted successfully');
        res.status(204).send();
    } catch (error) {
        console.error('❌ Database error deleting promotion:', error);
        res.status(500).json({ error: error.message });
    }N
};

// Lấy khuyến mãi theo mã
exports.getKhuyenMaiByCode = (req, res) => {
    const { code } = req.params;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const query = `
        SELECT * FROM KhuyenMai 
        WHERE MaKhuyenMai = ? 
        AND NgayBatDau <= ? 
        AND NgayKetThuc >= ?
        AND (GioiHanSuDung > 0 OR GioiHanSuDung IS NULL)
    `;
    
    db.connection.query(query, [code, currentDate, currentDate], (err, results) => {
        if (err) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi tìm mã khuyến mãi',
                error: err.message 
            });
        } else if (results.length === 0) {
            res.status(404).json({ 
                success: false, 
                message: 'Mã khuyến mãi không tồn tại hoặc đã hết hạn' 
            });
        } else {
            res.json(results[0]);
        }
    });
};

// Kiểm tra tính hợp lệ của mã khuyến mãi
exports.validatePromotion = (req, res) => {
    const { code } = req.params;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const query = `
        SELECT KhuyenMaiID, MaKhuyenMai, PhanTramGiam, GiamToiDa, GioiHanSuDung 
        FROM KhuyenMai 
        WHERE MaKhuyenMai = ? 
        AND NgayBatDau <= ? 
        AND NgayKetThuc >= ?
        AND (GioiHanSuDung > 0 OR GioiHanSuDung IS NULL)
    `;
    
    db.query(query, [code, currentDate, currentDate]).then(results => {
        res.json({ 
            isValid: results.length > 0,
            message: results.length > 0 ? 'Mã khuyến mãi hợp lệ' : 'Mã khuyến mãi không hợp lệ'
        });
    }).catch(err => {
        res.status(500).json({ 
            isValid: false, 
            message: 'Lỗi khi kiểm tra mã khuyến mãi' 
        });
    });
};

// Áp dụng mã khuyến mãi
exports.applyPromotion = (req, res) => {
    const { maKhuyenMai, tongTienGoc } = req.body;
    
    if (!maKhuyenMai || !tongTienGoc) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin mã khuyến mãi hoặc tổng tiền gốc'
        });
    }
    
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const query = `
        SELECT * FROM KhuyenMai 
        WHERE MaKhuyenMai = ? 
        AND NgayBatDau <= ? 
        AND NgayKetThuc >= ?
        AND (GioiHanSuDung > 0 OR GioiHanSuDung IS NULL)
    `;
    
    db.query(query, [maKhuyenMai, currentDate, currentDate]).then(results => {
        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã khuyến mãi không tồn tại hoặc đã hết hạn'
            });
        }
        
        const khuyenMai = results[0];
        const phanTramGiam = parseFloat(khuyenMai.PhanTramGiam);
        const giamToiDa = parseFloat(khuyenMai.GiamToiDa);
        
        // Tính số tiền giảm
        const soTienGiamTinhToan = (tongTienGoc * phanTramGiam) / 100;
        const soTienGiam = Math.min(soTienGiamTinhToan, giamToiDa);
        const tongTienSauGiam = Math.max(0, tongTienGoc - soTienGiam);
        
        res.json({
            success: true,
            data: {
                khuyenMai: khuyenMai,
                soTienGiam: soTienGiam,
                tongTienSauGiam: tongTienSauGiam
            },
            message: `Áp dụng mã khuyến mãi thành công! Giảm ${soTienGiam.toLocaleString('vi-VN')}₫`
        });
    }).catch(err => {
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra mã khuyến mãi',
            error: err.message
        });
    });
};
