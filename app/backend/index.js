const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Chargement des routes API
const servicesRouter = require('./routes/services');
const templatesRouter = require('./routes/templates');
const metaRouter = require('./routes/meta');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, 'public')));

// Utilisation des routes API
app.use('/api/services', servicesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api', metaRouter);

const settingsRouter = require('./routes/settings');
app.use('/api/settings', settingsRouter);

// Fallback SPA : toute route non-API renvoie index.html
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
