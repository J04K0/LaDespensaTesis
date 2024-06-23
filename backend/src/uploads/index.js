const express = require('express');
const app = express();
const fileRoutes = require('./routes/file.routes.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', file.routes.js);
app.use('/uploads', express.static('uploads'));

module.exports = app;

