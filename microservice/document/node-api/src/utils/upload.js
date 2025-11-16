const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['application/pdf', 'text/plain'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = {
    upload
}
