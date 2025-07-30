const express = require('express');
const path = require('path');

const router = express.Router();

const defaults = require(path.join(__dirname, '..', 'db', 'defaults.json'));
const fields = require(path.join(__dirname, '..', 'db', 'fields.json'));

router.get('/defaults', (req, res) => {
  res.json(defaults);
});

router.get('/fields', (req, res) => {
  res.json(fields);
});

module.exports = router;
