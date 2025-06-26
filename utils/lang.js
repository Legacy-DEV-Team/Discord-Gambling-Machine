const fs = require('fs');

const languages = {
  en: JSON.parse(fs.readFileSync('./lang/en.json')),
  no: JSON.parse(fs.readFileSync('./lang/no.json'))
};

const userLangPath = './userlang.json';
if (!fs.existsSync(userLangPath)) fs.writeFileSync(userLangPath, '{}');

function getLang(userId) {
  const data = JSON.parse(fs.readFileSync(userLangPath));
  return data[userId] || 'en';
}

function setLang(userId, lang) {
  const data = JSON.parse(fs.readFileSync(userLangPath));
  data[userId] = lang;
  fs.writeFileSync(userLangPath, JSON.stringify(data, null, 2));
}

function t(userId, key, vars = {}) {
  const lang = getLang(userId);
  const template = languages[lang]?.[key] || languages['en'][key] || key;
  return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{${k}}`, v), template);
}

module.exports = { getLang, setLang, t };
