const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Types MIME pour les fichiers
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`Requête reçue: ${req.method} ${req.url}`);
  
  // Déterminer le chemin du fichier demandé
  let filePath = '.' + req.url;
  
  // Si c'est la racine, servir test-mining-visual.html
  if (filePath === './') {
    filePath = './test-mining-visual.html';
  }
  
  // Obtenir l'extension du fichier
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Lire le fichier
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fichier non trouvé
        console.log(`Fichier non trouvé: ${filePath}`);
        res.writeHead(404);
        res.end('Fichier non trouvé');
      } else {
        // Erreur serveur
        console.log(`Erreur serveur: ${err.code}`);
        res.writeHead(500);
        res.end(`Erreur serveur: ${err.code}`);
      }
    } else {
      // Succès
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Serveur de test démarré sur http://localhost:${PORT}`);
  console.log('Accédez à http://localhost:3000 pour tester le système de minage');
});
