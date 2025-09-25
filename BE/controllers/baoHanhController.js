const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.getAllBaoHanhs = (req, res) => {
    db.query('SELECT * FROM BaoHanh', (err, results) => {
        if (err) res.status(500).send(err);
        else res.json(results);
    });
};

exports.getBaoHanhById = (req, res) => {
    db.query('SELECT * FROM BaoHanh WHERE BaoHanhID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.length === 0) res.status(404).send('BaoHanh not found');
        else res.json(results[0]);
    });
};

exports.createBaoHanh = (req, res) => {
    const baoHanhId = uuidv4(); // Generate UUID for BaoHanhID
    const newBaoHanh = { BaoHanhID: baoHanhId, ...req.body }; // Add BaoHanhID to the body
    db.query('INSERT INTO BaoHanh SET ?', newBaoHanh, (err, results) => {
        if (err) res.status(500).send(err);
        else res.status(201).json({ BaoHanhID: baoHanhId, ...newBaoHanh }); // Return generated BaoHanhID
    });
};


exports.updateBaoHanh = (req, res) => {
    db.query('UPDATE BaoHanh SET ? WHERE BaoHanhID = ?', [req.body, req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.affectedRows === 0) res.status(404).send('BaoHanh not found');
        else res.json({ BaoHanhID: req.params.id, ...req.body });
    });
};

exports.deleteBaoHanh = (req, res) => {
    db.query('DELETE FROM BaoHanh WHERE BaoHanhID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.affectedRows === 0) res.status(404).send('BaoHanh not found');
        else res.status(204).send();
    });
};
