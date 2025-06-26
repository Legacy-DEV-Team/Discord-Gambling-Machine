const fs = require('fs');
const path = './daily.json';

function loadData() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, '{}');
  return JSON.parse(fs.readFileSync(path));
}

function saveData(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function canClaim(userId) {
  const data = loadData();
  const last = data[userId]?.last || 0;
  const now = Date.now();
  return now - last >= 24 * 60 * 60 * 1000;
}

function getStreak(userId) {
  const data = loadData();
  return data[userId]?.streak || 0;
}

function claimBonus(userId) {
  const data = loadData();
  const now = Date.now();
  const last = data[userId]?.last || 0;
  const streak = (now - last <= 48 * 60 * 60 * 1000) ? (getStreak(userId) + 1) : 1;

  data[userId] = { last: now, streak };
  saveData(data);

  const amount = 100 + (streak - 1) * 50;
  return { amount, streak };
}

module.exports = { canClaim, claimBonus, getStreak };
