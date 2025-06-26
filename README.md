## 🎰 Gambling Bot for Discord

En komplett Discord-bot laget for virtuelle casinospill med støtte for:
- 🎰 Slot Machine
- 🃏 Blackjack (med Hit/Stand)
- 🎡 Roulette (med fargevalg)
- 💰 Virtuelle mynter
- 🎁 Daglig bonus med streak
- 🏆 Leaderboard for rikeste brukere
- 📜 Logging per bruker
- 🌐 Multispråk (norsk + engelsk)

## 🛠 Installasjon

```bash
git clone https://github.com/Legacy-DEV-Team/Discord-Gambling-Machine.git
cd Discord-Gambling-Machine
npm install
````

Rediger `config.js`:

```js
module.exports = {
  token: 'YOUR_DISCORD_BOT_TOKEN',
  ownerId: 'YOUR_DISCORD_USER_ID',
  clientId: 'YOUR_BOT_CLIENT_ID',
  slotWinMultiplier: 5
};
```

## 🚀 Kommandoer

```bash
npm run deploy   # Kjør én gang for å registrere slash-kommandoer
npm start        # Starter boten
```

## 📋 Funksjoner

### Spill

* **/setup**: Starter spillpanelet
* **🎰 Slot Machine**: Velg innsats og snurr
* **🃏 Blackjack**: Spill mot dealer med Hit/Stand
* **🎡 Roulette**: Velg farge og sats

### Økonomi

* 💰 `/givecoins` av eier
* 🎁 Daglig bonus med økende streak
* 🏆 Leaderboard for topp brukere
* 📜 Logger alle gevinster/tap

### Språk

* `/setlang` med støtte for:

  * 🇬🇧 English
  * 🇳🇴 Norsk

## 📁 Struktur

```
Discord-Gambling-Machine/
├── index.js
├── config.js
├── deploy-commands.js
├── coins.json
├── daily.json
├── userlang.json
├── lang/
│   ├── en.json
│   └── no.json
├── logs/
├── utils/
│   ├── coins.js
│   ├── daily.js
│   ├── logger.js
│   └── lang.js
```

## 📄 Lisens

Dette prosjektet er lisensiert under [MIT License](LICENSE).