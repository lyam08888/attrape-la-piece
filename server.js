// server.js - Serveur HTTP simple pour tester le jeu
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8000;

// Types MIME pour les différents fichiers
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Parse l'URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Si c'est la racine, servir index.html ou test-complex-world.html
    if (pathname === '/') {
        pathname = '/test-complex-world.html';
    }
    
    // Chemin complet du fichier
    const filePath = path.join(__dirname, pathname);
    
    // Vérifier si le fichier existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Fichier non trouvé
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <head><title>404 - Fichier non trouvé</title></head>
                    <body>
                        <h1>404 - Fichier non trouvé</h1>
                        <p>Le fichier <code>${pathname}</code> n'existe pas.</p>
                        <p><a href="/test-complex-world.html">Aller au test du monde complexe</a></p>
                    </body>
                </html>
            `);
            return;
        }
        
        // Lire le fichier
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>500 - Erreur serveur</title></head>
                        <body>
                            <h1>500 - Erreur serveur</h1>
                            <p>Impossible de lire le fichier: ${err.message}</p>
                        </body>
                    </html>
                `);
                return;
            }
            
            // Déterminer le type MIME
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = mimeTypes[ext] || 'application/octet-stream';
            
            // Headers CORS pour permettre les modules ES6
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Cache-Control': 'no-cache'
            });
            
            res.end(data);
        });
    });
});

server.listen(port, () => {
    console.log(`🚀 Serveur HTTP démarré sur http://localhost:${port}`);
    console.log(`📁 Répertoire: ${__dirname}`);
    console.log(`🌍 Test du monde complexe: http://localhost:${port}/test-complex-world.html`);
    console.log(`🎮 Jeu principal: http://localhost:${port}/index.html`);
    console.log('');
    console.log('Appuyez sur Ctrl+C pour arrêter le serveur');
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté');
        process.exit(0);
    });
});