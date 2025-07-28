const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const defaults = require('./defaults.json');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, 'public')));

// Route API qui retourne le contenu de defaults.json
app.get('/api/services', (req, res) => {
  res.json(defaults);
});

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
