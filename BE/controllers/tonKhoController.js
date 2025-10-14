const db = require('../db');

exports.getAllTonKhos = (req, res) => {
    const query = `
        SELECT 
            tk.*,
            sp.TenSanPham,
            sp.Model,
            sp.ThuongHieu,
            sp.HinhAnh,
            sp.GiaGoc,
            sp.GiamGia,
            dm.TenDanhMuc
        FROM TonKho tk
        LEFT JOIN SanPham sp ON tk.SanPhamID = sp.SanPhamID
        LEFT JOIN DanhMuc dm ON sp.DanhMucID = dm.DanhMucID
        ORDER BY tk.SoLuongTon ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error in getAllTonKhos:', err);
            res.status(500).json({ error: err.message });
        } else {
            // Process images to get first image if it's an array
            const processedResults = results.map(item => {
                if (item.HinhAnh) {
                    try {
                        // If it's a JSON string array, parse and take first image
                        if (typeof item.HinhAnh === 'string' && item.HinhAnh.startsWith('[') && item.HinhAnh.endsWith(']')) {
                            const images = JSON.parse(item.HinhAnh);
                            item.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
                        }
                    } catch (e) {
                        console.error("Error parsing HinhAnh JSON in inventory list:", e);
                        item.HinhAnh = '';
                    }
                }
                return item;
            });
            res.json(processedResults);
        }
    });
};

exports.getTonKhoById = async (req, res) => {
    try {
        const sanPhamId = req.params.id;
        
        // Validate UUID format
        if (!sanPhamId || typeof sanPhamId !== 'string') {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Optimized query with timeout handling
        const query = 'SELECT SoLuongTon FROM TonKho WHERE SanPhamID = ?';
        const results = await db.query(query, [sanPhamId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Inventory record not found' });
        }
        
        // Return only the essential data for faster response
        res.json({
            SanPhamID: sanPhamId,
            SoLuongTon: results[0].SoLuongTon || 0
        });
        
    } catch (error) {
        console.error('Error in getTonKhoById:', error);
        res.status(500).json({ error: 'Database error while fetching inventory' });
    }
};

// New batch inventory check endpoint for better performance
exports.checkBatchInventory = async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'Product IDs array is required' });
        }

        // Validate all IDs are strings
        const invalidIds = productIds.filter(id => typeof id !== 'string' || !id.trim());
        if (invalidIds.length > 0) {
            return res.status(400).json({ error: 'All product IDs must be valid strings' });
        }

        // Create placeholders for IN clause
        const placeholders = productIds.map(() => '?').join(',');
        const query = `SELECT SanPhamID, SoLuongTon FROM TonKho WHERE SanPhamID IN (${placeholders})`;
        
        const results = await db.query(query, productIds);
        
        // Create a map for quick lookup
        const inventoryMap = {};
        results.forEach(item => {
            inventoryMap[item.SanPhamID] = item.SoLuongTon || 0;
        });
        
        // Return inventory data for all requested products
        const inventoryData = productIds.map(productId => ({
            SanPhamID: productId,
            SoLuongTon: inventoryMap[productId] || 0
        }));
        
        res.json(inventoryData);
        
    } catch (error) {
        console.error('Error in checkBatchInventory:', error);
        res.status(500).json({ error: 'Database error while fetching batch inventory' });
    }
};

exports.updateTonKho = async (req, res) => {
    try {
        const { SoLuongTon } = req.body;
        const { id } = req.params;

        // Validate input
        if (SoLuongTon === undefined || SoLuongTon < 0) {
            return res.status(400).json({ error: 'Số lượng tồn kho phải là số không âm' });
        }

        // Check if inventory record exists
        const checkResults = await db.query('SELECT * FROM TonKho WHERE SanPhamID = ?', [id]);
        if (checkResults.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bản ghi tồn kho' });
        }

        // Update inventory
        const updateResults = await db.query(
            'UPDATE TonKho SET SoLuongTon = ? WHERE SanPhamID = ?',
            [SoLuongTon, id]
        );

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ error: 'Không thể cập nhật tồn kho' });
        }

        // Return updated inventory with product info
        const updatedQuery = `
            SELECT
                tk.*,
                sp.TenSanPham,
                sp.Model,
                sp.ThuongHieu,
                sp.HinhAnh,
                sp.GiaGoc,
                sp.GiamGia,
                dm.TenDanhMuc
            FROM TonKho tk
            LEFT JOIN SanPham sp ON tk.SanPhamID = sp.SanPhamID
            LEFT JOIN DanhMuc dm ON sp.DanhMucID = dm.DanhMucID
            WHERE tk.SanPhamID = ?
        `;

        const updatedResults = await db.query(updatedQuery, [id]);
        const updatedInventory = updatedResults[0];

        // Process image
        if (updatedInventory.HinhAnh) {
            try {
                if (typeof updatedInventory.HinhAnh === 'string' && updatedInventory.HinhAnh.startsWith('[') && updatedInventory.HinhAnh.endsWith(']')) {
                    const images = JSON.parse(updatedInventory.HinhAnh);
                    updatedInventory.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
                }
            } catch (e) {
                console.error("Error parsing HinhAnh JSON in update:", e);
                updatedInventory.HinhAnh = '';
            }
        }

        res.json(updatedInventory);

    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật tồn kho' });
    }
};

// Populate inventory data for existing products that don't have inventory records
exports.populateInventory = async (req, res) => {
    try {
        // Get all products that don't have inventory records
        const query = `
            SELECT sp.SanPhamID, sp.TenSanPham
            FROM SanPham sp
            LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
            WHERE tk.SanPhamID IS NULL
        `;

        const productsWithoutInventory = await db.query(query);

        if (productsWithoutInventory.length === 0) {
            return res.json({
                message: 'Tất cả sản phẩm đã có dữ liệu tồn kho',
                count: 0
            });
        }

        // Create inventory records with default quantity of 0
        const insertPromises = productsWithoutInventory.map(product => {
            return db.query(
                'INSERT INTO TonKho (SanPhamID, SoLuongTon) VALUES (?, ?) ON DUPLICATE KEY UPDATE SoLuongTon = SoLuongTon',
                [product.SanPhamID, 0]
            );
        });

        await Promise.all(insertPromises);

        res.json({
            message: `Đã tạo dữ liệu tồn kho cho ${productsWithoutInventory.length} sản phẩm`,
            count: productsWithoutInventory.length,
            products: productsWithoutInventory
        });

    } catch (error) {
        console.error('Error populating inventory:', error);
        res.status(500).json({ error: 'Lỗi khi tạo dữ liệu tồn kho' });
    }
};
