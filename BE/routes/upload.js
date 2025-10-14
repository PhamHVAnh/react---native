// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const router = express.Router();

// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) cb(null, true);
//   else cb(new Error('Only image files are allowed!'), false);
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 1024 * 1024 * 5 },
// });

// /**
//  * @swagger
//  * /api/upload:
//  *   post:
//  *     summary: Upload a single image
//  *    
//  *     tags:
//  *       - Upload
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               image:
//  *                 type: string
//  *                 format: binary
//  *                 description: File ảnh để upload
//  *     responses:
//  *       200:
//  *         description: Upload thành công
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UploadResponse'
//  *       400:
//  *         description: Không có file hoặc không đúng định dạng
//  */
// router.post('/', upload.single('image'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No image file uploaded.');
//   }

//   const filePath = `/uploads/${req.file.filename}`;

//   res.status(200).json({
//     message: 'Image uploaded successfully!',
//     filePath: filePath,
//   });
// });

// module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn 5MB mỗi file
});

/**
 * @swagger
 * /api/upload/:
 *   post:
 *     summary: Upload nhiều ảnh
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Danh sách ảnh để upload
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Images uploaded successfully!
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 filePaths:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - /uploads/169616234234-photo1.png
 *                     - /uploads/169616234567-photo2.jpg
 *       400:
 *         description: Không có file hoặc không đúng định dạng
 */
// Single image upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image file uploaded.');
  }

  const filePath = `/uploads/${req.file.filename}`;

  res.status(200).json({
    message: 'Image uploaded successfully!',
    filePath: filePath,
  });
});

// Multiple images upload
router.post('/multiple', upload.array('images'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No image files uploaded.');
  }

  const filePaths = req.files.map(file => `/uploads/${file.filename}`);

  res.status(200).json({
    message: 'Images uploaded successfully!',
    count: req.files.length,
    filePaths: filePaths,
  });
});

module.exports = router;
