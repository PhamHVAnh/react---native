const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.getAllSanPhams = async (req, res) => {
    try {
        const query = `
            SELECT sp.*, COALESCE(tk.SoLuongTon, 0) as SoLuongTon
            FROM SanPham sp
            LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
            ORDER BY sp.SanPhamID DESC
        `;
        const results = await db.query(query);
        
        const sanPhams = results.map(sp => {
            if (sp.ThuocTinh && typeof sp.ThuocTinh === 'string') {
                try {
                    sp.ThuocTinh = JSON.parse(sp.ThuocTinh);
                } catch (e) {
                    // Ignore parsing error
                }
            }
            if (sp.HinhAnh && typeof sp.HinhAnh === 'string') {
                if (sp.HinhAnh.startsWith('[') && sp.HinhAnh.endsWith(']')) {
                    try {
                        sp.HinhAnh = JSON.parse(sp.HinhAnh);
                    } catch (e) {
                        // Ignore parsing error
                    }
                } else {
                    sp.HinhAnh = [sp.HinhAnh];
                }
            }
            return sp;
        });
        
        res.json(sanPhams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSanPhamById = async (req, res) => {
    try {
        const query = `
            SELECT sp.*, COALESCE(tk.SoLuongTon, 0) as SoLuongTon
            FROM SanPham sp
            LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
            WHERE sp.SanPhamID = ?
        `;
        const results = await db.query(query, [req.params.id]);
        if (results.length === 0) {
            return res.status(404).send('SanPham not found');
        }
        const sanPham = results[0];
        if (sanPham.ThuocTinh && typeof sanPham.ThuocTinh === 'string') {
            try {
                sanPham.ThuocTinh = JSON.parse(sanPham.ThuocTinh);
            } catch (e) {
                console.error("Error parsing ThuocTinh JSON:", e);
            }
        }
        if (sanPham.HinhAnh && typeof sanPham.HinhAnh === 'string') {
            if (sanPham.HinhAnh.startsWith('[') && sanPham.HinhAnh.endsWith(']')) {
                try {
                    sanPham.HinhAnh = JSON.parse(sanPham.HinhAnh);
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON:", e);
                }
            } else {
                sanPham.HinhAnh = [sanPham.HinhAnh];
            }
        }
        res.json(sanPham);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.createSanPham = async (req, res) => {
    const sanPhamId = uuidv4();
    const newSanPham = { SanPhamID: sanPhamId, ...req.body };
    if (newSanPham.ThuocTinh) {
        newSanPham.ThuocTinh = JSON.stringify(newSanPham.ThuocTinh);
    }
    if (newSanPham.HinhAnh && Array.isArray(newSanPham.HinhAnh)) {
        newSanPham.HinhAnh = JSON.stringify(newSanPham.HinhAnh);
    }
    try {
        await db.query('INSERT INTO SanPham SET ?', newSanPham);

        // Tự động tạo bản ghi tồn kho cho sản phẩm mới
        const defaultStockQuantity = 0; // Mặc định số lượng tồn kho = 0
        await db.query('INSERT INTO TonKho (SanPhamID, SoLuongTon) VALUES (?, ?) ON DUPLICATE KEY UPDATE SoLuongTon = SoLuongTon', [sanPhamId, defaultStockQuantity]);

        const createdSanPham = { SanPhamID: sanPhamId, ...req.body };
        if (createdSanPham.HinhAnh && typeof createdSanPham.HinhAnh === 'string') {
            if (createdSanPham.HinhAnh.startsWith('[') && createdSanPham.HinhAnh.endsWith(']')) {
                try {
                    createdSanPham.HinhAnh = JSON.parse(createdSanPham.HinhAnh);
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON:", e);
                }
            } else {
                createdSanPham.HinhAnh = [createdSanPham.HinhAnh];
            }
        }
        res.status(201).json(createdSanPham);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.updateSanPham = async (req, res) => {
    const updateData = { ...req.body };
    if (updateData.ThuocTinh) {
        updateData.ThuocTinh = JSON.stringify(updateData.ThuocTinh);
    }
    if (updateData.HinhAnh && Array.isArray(updateData.HinhAnh)) {
        updateData.HinhAnh = JSON.stringify(updateData.HinhAnh);
    }
    try {
        const results = await db.query('UPDATE SanPham SET ? WHERE SanPhamID = ?', [updateData, req.params.id]);
        if (results.affectedRows === 0) {
            return res.status(404).send('SanPham not found');
        }
        
        // Return the updated product data with proper formatting
        const updatedSanPham = { SanPhamID: req.params.id, ...req.body };
        
        // Parse HinhAnh if it's a JSON string
        if (updatedSanPham.HinhAnh && typeof updatedSanPham.HinhAnh === 'string') {
            if (updatedSanPham.HinhAnh.startsWith('[') && updatedSanPham.HinhAnh.endsWith(']')) {
                try {
                    updatedSanPham.HinhAnh = JSON.parse(updatedSanPham.HinhAnh);
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON:", e);
                }
            } else {
                updatedSanPham.HinhAnh = [updatedSanPham.HinhAnh];
            }
        }
        
        // Parse ThuocTinh if it's a JSON string
        if (updatedSanPham.ThuocTinh && typeof updatedSanPham.ThuocTinh === 'string') {
            try {
                updatedSanPham.ThuocTinh = JSON.parse(updatedSanPham.ThuocTinh);
            } catch (e) {
                console.error("Error parsing ThuocTinh JSON:", e);
            }
        }
        
        res.json(updatedSanPham);
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSanPham = async (req, res) => {
    try {
        const results = await db.query('DELETE FROM SanPham WHERE SanPhamID = ?', [req.params.id]);
        if (results.affectedRows === 0) {
            return res.status(404).send('SanPham not found');
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).send(err);
    }
};


exports.searchSanPham = async (req, res) => {
    console.log("Search SanPham function called.");
    const searchTerm = req.query.q;

    if (!searchTerm) {
        console.log("Search term 'q' is missing.");
        return res.status(400).json({ message: "Search term 'q' is required" });
    }

    const query = `
        SELECT sp.*, COALESCE(tk.SoLuongTon, 0) as SoLuongTon
        FROM SanPham sp
        LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
        WHERE LOWER(sp.TenSanPham) LIKE ?
    `;
    const values = [`%${searchTerm.toLowerCase()}%`];

    console.log("Executing SQL Query:", query);
    console.log("With values:", values);

    try {
        const results = await db.query(query, values);

        console.log("Database query successful. Number of results:", results.length);

        const sanPhams = results.map(sp => {
            if (sp.ThuocTinh && typeof sp.ThuocTinh === 'string') {
                try {
                    sp.ThuocTinh = JSON.parse(sp.ThuocTinh);
                } catch (e) {
                    console.error("Error parsing ThuocTinh JSON:", e);
                }
            }
            if (sp.HinhAnh && typeof sp.HinhAnh === 'string') {
                if (sp.HinhAnh.startsWith('[') && sp.HinhAnh.endsWith(']')) {
                    try {
                        sp.HinhAnh = JSON.parse(sp.HinhAnh);
                    } catch (e) {
                        console.error("Error parsing HinhAnh JSON:", e);
                    }
                } else {
                    sp.HinhAnh = [sp.HinhAnh];
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

// Get products by category (including child categories)
exports.getSanPhamByCategory = async (req, res) => {
    const { categoryId } = req.params;
    console.log("Get products by category:", categoryId);

    try {
        // First, get all child categories of the given category
        const childCategoriesQuery = 'SELECT DanhMucID FROM DanhMuc WHERE ParentID = ?';
        const childCategories = await db.query(childCategoriesQuery, [categoryId]);
        
        // Create list of category IDs to search (parent + children)
        const categoryIds = [categoryId];
        childCategories.forEach(child => categoryIds.push(child.DanhMucID));
        
        // Create placeholders for the IN clause
        const placeholders = categoryIds.map(() => '?').join(',');
        const query = `
            SELECT sp.*, COALESCE(tk.SoLuongTon, 0) as SoLuongTon
            FROM SanPham sp
            LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
            WHERE sp.DanhMucID IN (${placeholders})
            ORDER BY sp.SanPhamID DESC
        `;
        
        
        const results = await db.query(query, categoryIds);
        
        const sanPhams = results.map(sp => {
            if (sp.ThuocTinh && typeof sp.ThuocTinh === 'string') {
                try {
                    sp.ThuocTinh = JSON.parse(sp.ThuocTinh);
                } catch (e) {
                    console.error("Error parsing ThuocTinh JSON:", e);
                }
            }
            if (sp.HinhAnh && typeof sp.HinhAnh === 'string') {
                if (sp.HinhAnh.startsWith('[') && sp.HinhAnh.endsWith(']')) {
                    try {
                        sp.HinhAnh = JSON.parse(sp.HinhAnh);
                    } catch (e) {
                        console.error("Error parsing HinhAnh JSON:", e);
                    }
                } else {
                    sp.HinhAnh = [sp.HinhAnh];
                }
            }
            return sp;
        });

        // console.log("Found", sanPhams.length, "products in category and subcategories");
        res.json(sanPhams);
    } catch (err) {
        console.error("Error getting products by category:", err);
        res.status(500).json({ message: "Database query failed", error: err.message });
    }
};