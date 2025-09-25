const db = require('../db');

exports.getAllTonKhos = (req, res) => {
    db.query('SELECT * FROM TonKho', (err, results) => {
        if (err) res.status(500).send(err);
        else res.json(results);
    });
};

exports.getTonKhoById = (req, res) => {
    db.query('SELECT * FROM TonKho WHERE SanPhamID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.length === 0) res.status(404).send('TonKho not found');
        else res.json(results[0]);
    });
};
