const fs = require('fs');
const path = './coins.json';

function loadCoins() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, '{}');
  return JSON.parse(fs.readFileSync(path));
}

function saveCoins(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function getBalance(userId) {
  const data = loadCoins();
  return data[userId] ?? 0;
}

function setBalance(userId, amount) {
  const data = loadCoins();
  data[userId] = amount;
  saveCoins(data);
}

function addCoins(userId, amount) {
  const data = loadCoins();
  data[userId] = (data[userId] || 0) + amount;
  saveCoins(data);
}

function removeCoins(userId, amount) {
  const data = loadCoins();
  data[userId] = Math.max(0, (data[userId] || 0) - amount);
  saveCoins(data);
}

function getTopBalances(limit = 10) {
  const data = loadCoins();
  return Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, balance]) => ({ id, balance }));
}

module.exports = {
  getBalance, setBalance, addCoins, removeCoins, getTopBalances
};
