const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
    // console.log('Request received for getAllCategories');
    try {
        const categories = await db.query('SELECT * FROM DanhMuc');
        res.json(categories);
    } catch (err) {
        console.error("Error getting all categories:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const [category] = await db.query('SELECT * FROM DanhMuc WHERE DanhMucID = ?', [id]);
        if (!category || category.length === 0) {
            return res.status(404).send('Category not found');
        }
        res.json(category[0]);
    } catch (err) {
        // console.error("Error getting category by ID:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
    const { TenDanhMuc, MoTa, ParentID } = req.body;

    if (!TenDanhMuc) {
        return res.status(400).send('Category name is required');
    }

    const newCategory = {
        DanhMucID: uuidv4(),
        TenDanhMuc,
        MoTa: MoTa || null,
        ParentID: ParentID || null,
    };

    try {
        await db.query('INSERT INTO DanhMuc SET ?', newCategory);
        res.status(201).json(newCategory);
    } catch (err) {
        // console.error("Error creating category:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { TenDanhMuc, MoTa, ParentID } = req.body;

    if (!TenDanhMuc) {
        return res.status(400).send('Category name is required');
    }

    try {
        const [existingCategory] = await db.query('SELECT * FROM DanhMuc WHERE DanhMucID = ?', [id]);
        if (existingCategory.length === 0) {
            return res.status(404).send('Category not found');
        }

        const updatedCategory = {
            TenDanhMuc,
            MoTa: MoTa || null,
            ParentID: ParentID || null,
        };

        await db.query('UPDATE DanhMuc SET ? WHERE DanhMucID = ?', [updatedCategory, id]);
        res.json({ DanhMucID: id, ...updatedCategory });
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('DELETE FROM DanhMuc WHERE DanhMucID = ?', [id]);
        if (results.affectedRows === 0) {
            return res.status(404).send('Category not found');
        }
        res.status(204).send();
    } catch (err) {
        // console.error("Error deleting category:", err);
        res.status(500).send('Internal Server Error');
    }
};
