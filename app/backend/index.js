const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, 'public')));

// Exemple route API
app.get('/api/services', (req, res) => {
  res.json([{ name: "exemple", port: 1234 }]);
});

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
