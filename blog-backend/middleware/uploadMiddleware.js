const multer = require('multer');
const path = require('path');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, `uploads/${folder}/`),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const valid = allowed.test(path.extname(file.originalname).toLowerCase())
             && allowed.test(file.mimetype);
  valid ? cb(null, true) : cb(new Error('Images uniquement !'));
};

module.exports = {
  uploadAvatar:   multer({ storage: createStorage('avatars'),  fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }),
  uploadCover:    multer({ storage: createStorage('covers'),   fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  uploadArticle:  multer({ storage: createStorage('articles'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  uploadMessage:  multer({ storage: createStorage('messages'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  // ── Nouveau pour les cercles ──────────────────────────────
  uploadCircle:   multer({ storage: createStorage('circles'),  fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
};