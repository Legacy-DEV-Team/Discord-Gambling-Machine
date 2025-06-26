## 🎰 Discord Gambling Machine

A complete Discord bot for virtual casino games featuring:
- 🎰 Slot Machine
- 🃏 Blackjack (with Hit/Stand)
- 🎡 Roulette (with color choice)
- 💰 Virtual currency stored per user
- 🎁 Daily bonus with streak system
- 🏆 Leaderboard for top richest users
- 📜 Per-user activity logging
- 🌐 Multilingual support (English + Norwegian)

---

## 🛠 Installation

```bash
git clone https://github.com/Legacy-DEV-Team/Discord-Gambling-Machine.git
cd Discord-Gambling-Machine
npm install
````

Edit `config.js` with your bot details:

```js
module.exports = {
  token: 'YOUR_DISCORD_BOT_TOKEN',
  ownerId: 'YOUR_DISCORD_USER_ID',
  clientId: 'YOUR_BOT_CLIENT_ID',
  slotWinMultiplier: 5
};
```

---

## 🚀 Commands

```bash
npm run deploy   # Run once to register slash commands
npm start        # Launch the bot
```

---

## 🎮 Features

### Games

* **/setup**: Opens the main game panel
* **🎰 Slot Machine**: Pick a wager and spin
* **🃏 Blackjack**: Play against dealer using Hit or Stand
* **🎡 Roulette**: Choose color and bet

### Economy

* 💰 `/givecoins` (owner only)
* 🎁 Daily bonus increases with streak
* 🏆 Leaderboard shows top 10 richest users
* 📜 Logging of all transactions and results

### Language

* `/setlang` to select language:

  * 🇬🇧 English
  * 🇳🇴 Norsk

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) – free to use and modify.