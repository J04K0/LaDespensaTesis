import express from 'express';
const router = express.Router();


router.post('/upload', (req, res) => {

  res.send('File uploaded');
});

export default router;
