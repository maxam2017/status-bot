const sqlite3 = require('sqlite3').verbose();

function getDB() {
  return new sqlite3.Database('./sqlite.db');
}

module.exports = {
  getDB,
};
