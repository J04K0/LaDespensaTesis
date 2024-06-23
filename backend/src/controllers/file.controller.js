const path = require('path');
const fs = require('fs');

const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.status(200).send({
    message: 'File uploaded successfully',
    file: req.file
  });
};

const getFiles = (req, res) => {
  const directoryPath = path.join(__dirname, '../../uploads');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send({
        message: 'Unable to scan files',
        error: err
      });
    }
    res.status(200).send(files);
  });
};

module.exports = {
  uploadFile,
  getFiles
};

