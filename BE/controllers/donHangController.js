const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.getAllDonHangs = (req, res) => {
    db.query('SELECT * FROM DonHang', (err, results) => {
        if (err) res.status(500).send(err);
        else res.json(results);
    });
};

exports.getDonHangById = (req, res) => {
    db.query('SELECT * FROM DonHang WHERE DonHangID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.length === 0) res.status(404).send('DonHang not found');
        else res.json(results[0]);
    });
};

exports.createDonHang = (req, res) => {
    const donHangId = uuidv4(); // Generate UUID for DonHangID
    const newDonHang = { DonHangID: donHangId, ...req.body }; // Add DonHangID to the body
    db.query('INSERT INTO DonHang SET ?', newDonHang, (err, results) => {
        if (err) res.status(500).send(err);
        else res.status(201).json({ DonHangID: donHangId, ...newDonHang }); // Return generated DonHangID
    });
};

exports.updateDonHang = (req, res) => {
    db.query('UPDATE DonHang SET ? WHERE DonHangID = ?', [req.body, req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.affectedRows === 0) res.status(404).send('DonHang not found');
        else res.json({ DonHangID: req.params.id, ...req.body });
    });
};

exports.deleteDonHang = (req, res) => {
    db.query('DELETE FROM DonHang WHERE DonHangID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.affectedRows === 0) res.status(404).send('DonHang not found');
        else res.status(204).send();
    });
};
