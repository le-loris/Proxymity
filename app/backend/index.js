const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Synchronisation des fichiers de configuration par défaut
const utils = require('./utils');
utils.syncDbDefaults();

// Chargement des routes API
const servicesRouter = require('./routes/v1/services');
const templatesRouter = require('./routes/v1/templates');
const metaRouter = require('./routes/v1/meta');
const settingsRouter = require('./routes/v1/settings');
const exportRouter = require('./routes/v1/export');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());


// Utilisation des routes API
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/templates', templatesRouter);
app.use('/api/v1/meta', metaRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/export', exportRouter);


// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback SPA : toute route non-API renvoie index.html
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
