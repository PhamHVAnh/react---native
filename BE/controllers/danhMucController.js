const db = require('../db');
// const { v4: uuidv4 } = require('uuid'); // No longer needed for auto-increment ID

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await db.query('SELECT * FROM DanhMuc');
        res.json(categories);
    } catch (err) {
        console.error("Error getting all categories:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await db.query('SELECT * FROM DanhMuc WHERE DanhMucID = ?', [id]);
        if (category.length === 0) {
            return res.status(404).send('Category not found');
        }
        res.json(category[0]);
    } catch (err) {
        console.error("Error getting category by ID:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    const { DanhMucID, TenDanhMuc, MoTa, ParentID } = req.body; // Destructure DanhMucID to exclude it
    // DanhMucID is now auto-incremented, no need to generate UUID

    if (!TenDanhMuc) {
        return res.status(400).send('Category name is required');
    }

    const newCategory = {
        TenDanhMuc,
        MoTa: MoTa || null,
        ParentID: ParentID !== undefined && ParentID !== null ? parseInt(ParentID) : null, // Ensure ParentID is int or null
    };

    try {
        const result = await db.query('INSERT INTO DanhMuc SET ?', newCategory);
        // Return the newly created category with its auto-generated ID
        res.status(201).json({ DanhMucID: result.insertId, ...newCategory });
    } catch (err) {
        console.error("Error creating category:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { TenDanhMuc, MoTa, ParentID } = req.body;

    if (!TenDanhMuc) {
        return res.status(400).send('Category name is required');
    }

    try {
        const existingCategory = await db.query('SELECT * FROM DanhMuc WHERE DanhMucID = ?', [id]);
        if (existingCategory.length === 0) {
            return res.status(404).send('Category not found');
        }

        const updatedCategory = {
            TenDanhMuc,
            MoTa: MoTa || null,
            ParentID: ParentID !== undefined && ParentID !== null ? parseInt(ParentID) : null, // Ensure ParentID is int or null
        };

        await db.query('UPDATE DanhMuc SET ? WHERE DanhMucID = ?', [updatedCategory, id]);
        res.json({ DanhMucID: parseInt(id), ...updatedCategory });
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).send('Internal Server Error');
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const results = await db.query('DELETE FROM DanhMuc WHERE DanhMucID = ?', [id]);
        if (results.affectedRows === 0) {
            return res.status(404).send('Category not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error("Error deleting category:", err);
        res.status(500).send('Internal Server Error');
    }
};