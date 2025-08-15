const gen = require('./app/backend/generator');
(async () => {
  try {
    await gen.execute('./app/backend/db/services.json','./app/backend/templates','./app/backend/sites-availables-backup','./app/backend/sites-availables');
    console.log('Done');
  } catch (e) {
    console.error(e);
  }
})();
