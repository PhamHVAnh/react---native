const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.getAllKhuyenMais = (req, res) => {
    db.query('SELECT * FROM KhuyenMai', (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
};

// Lấy khuyến mãi còn hiệu lực
exports.getActivePromotions = (req, res) => {
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const query = `
        SELECT * FROM KhuyenMai 
        WHERE NgayBatDau <= ? 
        AND NgayKetThuc >= ?
        AND (GioiHanSuDung > 0 OR GioiHanSuDung IS NULL)
        ORDER BY NgayKetThuc ASC
    `;
    
    db.connection.query(query, [currentDate, currentDate], (err, results) => {
        if (err) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi lấy danh sách khuyến mãi',
                error: err.message 
            });
        } else {
            res.json(results);
        }
    });
};

exports.getKhuyenMaiById = (req, res) => {
    db.query('SELECT * FROM KhuyenMai WHERE KhuyenMaiID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.length === 0) res.status(404).send('KhuyenMai not found');
        else res.json(results[0]);
    });
};

exports.createKhuyenMai = (req, res) => {
    const khuyenMaiId = uuidv4(); // Generate UUID for KhuyenMaiID
    const newKhuyenMai = { KhuyenMaiID: khuyenMaiId, ...req.body }; // Add KhuyenMaiID to the body
    db.query('INSERT INTO KhuyenMai SET ?', newKhuyenMai, (err, results) => {
        if (err) res.status(500).send(err);
        else res.status(201).json({ KhuyenMaiID: khuyenMaiId, ...newKhuyenMai }); // Return generated KhuyenMaiID
    });
};


exports.updateKhuyenMai = (req, res) => {
    db.query('UPDATE KhuyenMai SET ? WHERE KhuyenMaiID = ?', [req.body, req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.affectedRows === 0) res.status(404).send('KhuyenMai not found');
        else res.json({ KhuyenMaiID: req.params.id, ...req.body });
    });
};

exports.deleteKhuyenMai = (req, res) => {
    db.query('DELETE FROM KhuyenMai WHERE KhuyenMaiID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.affectedRows === 0) res.status(404).send('KhuyenMai not found');
        else res.status(204).send();
    });
};
