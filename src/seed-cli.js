const { db, seedIfEmpty, dbPath } = require('./db');
if (process.argv.includes('--reset')) {
  db.exec('DELETE FROM comments; DELETE FROM posts; DELETE FROM sqlite_sequence;');
  console.log('Cleared posts and comments.');
}
console.log(seedIfEmpty() ? `Seeded sample posts into ${dbPath}` : 'Database already has posts. Use "npm run seed -- --reset" to start over.');
