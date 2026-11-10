// Génère des tokens JWT de test pour le header "auth-user".
// Usage : npm run tokens   (lit JWT_SECRET dans .env grâce à --env-file)
// La sortie est au format des variables REST Client : à coller dans requests.http.
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET manquant : créez le fichier .env (voir .env.example)');
  process.exit(1);
}

const options = { expiresIn: '7d' };

const tokens = {
  tokenUser1: jwt.sign({ userId: 1 }, secret, options),
  tokenUser2: jwt.sign({ userId: 2 }, secret, options),
  // Cas d'erreur : signature valide mais pas de userId.
  tokenSansUserId: jwt.sign({ username: 'anonyme' }, secret, options),
  // Cas d'erreur : userId présent mais signé avec un autre secret.
  tokenMauvaisSecret: jwt.sign({ userId: 1 }, 'un-autre-secret', options),
};

for (const [name, token] of Object.entries(tokens)) {
  console.log(`@${name} = ${token}`);
}
