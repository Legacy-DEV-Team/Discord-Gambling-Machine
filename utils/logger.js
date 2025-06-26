const fs = require('fs');
const path = './logs/';

if (!fs.existsSync(path)) fs.mkdirSync(path);

function log(userId, message) {
  const filepath = `${path}${userId}.log`;
  const timestamp = new Date().toISOString();
  fs.appendFileSync(filepath, `[${timestamp}] ${message}\n`);
}

module.exports = { log };
