const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.getAllSanPhams = (req, res) => {
    db.query('SELECT * FROM SanPham', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        const sanPhams = results.map(sp => {
            if (sp.ThuocTinh && typeof sp.ThuocTinh === 'string') {
                try {
                    sp.ThuocTinh = JSON.parse(sp.ThuocTinh);
                } catch (e) {
                    // Handle JSON parsing error if necessary
                    console.error("Error parsing ThuocTinh JSON:", e);
                }
            }
            return sp;
        });
        res.json(sanPhams);
    });
};

exports.getSanPhamById = (req, res) => {
    db.query('SELECT * FROM SanPham WHERE SanPhamID = ?', [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.length === 0) {
            return res.status(404).send('SanPham not found');
        }
        const sanPham = results[0];
        if (sanPham.ThuocTinh && typeof sanPham.ThuocTinh === 'string') {
            try {
                sanPham.ThuocTinh = JSON.parse(sanPham.ThuocTinh);
            } catch (e) {
                // Handle JSON parsing error if necessary
                console.error("Error parsing ThuocTinh JSON:", e);
            }
        }
        res.json(sanPham);
    });
};

exports.createSanPham = (req, res) => {
    const sanPhamId = uuidv4();
    const newSanPham = { SanPhamID: sanPhamId, ...req.body };
    if (newSanPham.ThuocTinh) {
        newSanPham.ThuocTinh = JSON.stringify(newSanPham.ThuocTinh);
    }
    db.query('INSERT INTO SanPham SET ?', newSanPham, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(201).json({ SanPhamID: sanPhamId, ...req.body });
    });
};

exports.updateSanPham = (req, res) => {
    const updateData = { ...req.body };
    if (updateData.ThuocTinh) {
        updateData.ThuocTinh = JSON.stringify(updateData.ThuocTinh);
    }
    db.query('UPDATE SanPham SET ? WHERE SanPhamID = ?', [updateData, req.params.id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('SanPham not found');
        }
        res.json({ SanPhamID: req.params.id, ...req.body });
    });
};

exports.deleteSanPham = (req, res) => {
    db.query('DELETE FROM SanPham WHERE SanPhamID = ?', [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('SanPham not found');
        }
        res.status(204).send();
    });
};


exports.searchSanPham = async (req, res) => { // Added async
    console.log("Search SanPham function called."); // Re-added original log
    const searchTerm = req.query.q;

    if (!searchTerm) {
        console.log("Search term 'q' is missing."); // Re-added original log
        return res.status(400).json({ message: "Search term 'q' is required" });
    }

    const query = 'SELECT * FROM SanPham WHERE LOWER(TenSanPham) LIKE ?';
    const values = [`%${searchTerm.toLowerCase()}%`];

    console.log("Executing SQL Query:", query); // Re-added original log
    console.log("With values:", values); // Re-added original log

    try { // Added try-catch for async/await
        const results = await db.query(query, values); // Await the promise

        console.log("Database query successful. Number of results:", results.length);

        const sanPhams = results.map(sp => {
            if (sp.ThuocTinh && typeof sp.ThuocTinh === 'string') {
                try {
                    sp.ThuocTinh = JSON.parse(sp.ThuocTinh);
                } catch (e) {
                    console.error("Error parsing ThuocTinh JSON:", e);
                }
            }
            return sp;
        });

        console.log("Sending response with", sanPhams.length, "products.");
        res.json(sanPhams);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ message: "Database query failed", error: err.message });
    }
};