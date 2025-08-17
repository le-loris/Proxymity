const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Synchronisation des fichiers de configuration par défaut
const utils = require('./routes/utils');
utils.syncDbDefaults();

// Chargement des routes API
const servicesRouter = require('./routes/services');
const templatesRouter = require('./routes/templates');
const metaRouter = require('./routes/meta');
const settingsRouter = require('./routes/settings');
const exportRouter = require('./routes/export');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());


// Utilisation des routes API
app.use('/api/services', servicesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api', metaRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/export', exportRouter);


// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback SPA : toute route non-API renvoie index.html
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
