const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events
} = require('discord.js');

const {
  token,
  ownerId,
  slotWinMultiplier
} = require('./config');

const {
  getBalance,
  addCoins,
  removeCoins,
  getTopBalances
} = require('./utils/coins');

const { canClaim, claimBonus } = require('./utils/daily');
const { log } = require('./utils/logger');
const { getLang, setLang, t } = require('./utils/lang');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎'];
const activeBlackjackGames = new Map();

function drawCard() {
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  return values[Math.floor(Math.random() * values.length)];
}

function calculatePoints(hand) {
  let points = 0;
  let aces = 0;
  for (const card of hand) {
    if (['J', 'Q', 'K'].includes(card)) points += 10;
    else if (card === 'A') { aces++; points += 11; }
    else points += parseInt(card);
  }
  while (points > 21 && aces > 0) {
    points -= 10;
    aces--;
  }
  return points;
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const userId = interaction.user.id;

    if (interaction.commandName === 'setup') {
      if (userId !== ownerId) {
        return interaction.reply({ content: '❌ You are not authorized.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎰 Casino Panel')
        .setDescription('Choose a game to play or check your balance!')
        .setColor(0x0099ff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('slot').setLabel('🎰 Slot Machine').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('blackjack').setLabel('🃏 Blackjack').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('roulette').setLabel('🎡 Roulette').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('balance').setLabel('💰 Balance').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('daily').setLabel('🎁 Daily Bonus').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('leaderboard').setLabel('🏆 Leaderboard').setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.commandName === 'givecoins') {
      if (userId !== ownerId) {
        return interaction.reply({ content: '❌ You are not authorized.', ephemeral: true });
      }

      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      addCoins(target.id, amount);

      log(userId, `GAVE ${amount} coins to ${target.tag}`);
      log(target.id, `RECEIVED ${amount} coins from owner`);

      return interaction.reply({ content: `✅ Gave ${amount} coins to ${target.tag}` });
    }

    if (interaction.commandName === 'setlang') {
      const lang = interaction.options.getString('lang');
      setLang(userId, lang);
      return interaction.reply({ content: `🌐 Language set to ${lang}.`, ephemeral: true });
    }
  }

    if (interaction.isButton()) {
    const userId = interaction.user.id;

    // 💰 Balance
    if (interaction.customId === 'balance') {
      const balance = getBalance(userId);
      return interaction.reply({
        content: t(userId, 'balance', { amount: balance }),
        ephemeral: true
      });
    }

    // 🎁 Daily bonus
    if (interaction.customId === 'daily') {
      if (!canClaim(userId)) {
        return interaction.reply({
          content: t(userId, 'daily_claimed'),
          ephemeral: true
        });
      }

      const { amount, streak } = claimBonus(userId);
      addCoins(userId, amount);
      log(userId, `Claimed daily bonus +${amount} (Streak ${streak})`);

      return interaction.reply({
        content: t(userId, 'daily_bonus', { amount, streak }),
        ephemeral: true
      });
    }

    // 🏆 Leaderboard
    if (interaction.customId === 'leaderboard') {
      const top = getTopBalances();
      const lines = await Promise.all(top.map(async (entry, i) => {
        const user = await client.users.fetch(entry.id).catch(() => null);
        const name = user ? user.tag : `User ${entry.id}`;
        return `**#${i + 1}** – ${name}: ${entry.balance} coins`;
      }));

      const embed = new EmbedBuilder()
        .setTitle(t(userId, 'leaderboard_title'))
        .setDescription(lines.join('\n'))
        .setColor(0xf1c40f);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 🎰 Slot Machine – Innsatsvalg
    if (interaction.customId === 'slot') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('slot_10').setLabel('🎰 Bet 10').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('slot_25').setLabel('🎰 Bet 25').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('slot_50').setLabel('🎰 Bet 50').setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        content: '🎰 Choose your bet amount:',
        components: [row],
        ephemeral: true
      });
    }

    // 🎰 Slot Machine – Spillresultat
    if (interaction.customId.startsWith('slot_')) {
      const wager = parseInt(interaction.customId.split('_')[1]);
      if (getBalance(userId) < wager) {
        return interaction.reply({ content: t(userId, 'not_enough'), ephemeral: true });
      }

      removeCoins(userId, wager);
      const result = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
      const win = result.every(s => s === result[0]);
      const payout = win ? wager * slotWinMultiplier : 0;
      if (win) addCoins(userId, payout);

      log(userId, `Slot ${win ? 'WIN' : 'LOSS'} ${win ? '+' + payout : '-' + wager}`);

      const embed = new EmbedBuilder()
        .setTitle('🎰 Slot Result')
        .setDescription(`\`${result.join(' | ')}\`\n${t(userId, win ? 'slot_win' : 'slot_loss', { amount: win ? payout : wager })}`)
        .setColor(win ? 0x00ff00 : 0xff0000);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

        // 🃏 Blackjack – innsatsvalg
    if (interaction.customId === 'blackjack') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bj_10').setLabel('🃏 Bet 10').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('bj_25').setLabel('🃏 Bet 25').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('bj_50').setLabel('🃏 Bet 50').setStyle(ButtonStyle.Secondary)
      );
      return interaction.reply({ content: '🃏 Choose your bet amount for Blackjack:', components: [row], ephemeral: true });
    }

    // 🃏 Blackjack – start spill
    if (interaction.customId.startsWith('bj_')) {
      const wager = parseInt(interaction.customId.split('_')[1]);
      if (getBalance(userId) < wager) return interaction.reply({ content: t(userId, 'not_enough'), ephemeral: true });

      const player = [drawCard(), drawCard()];
      const dealer = [drawCard()];

      removeCoins(userId, wager);
      activeBlackjackGames.set(userId, { player, dealer, wager });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('hit').setLabel('➕ Hit').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('stand').setLabel('🛑 Stand').setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setDescription(`Your hand: ${player.join(', ')} (${calculatePoints(player)} pts)\nDealer shows: ${dealer[0]}`)
        .setColor(0x5865f2);

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // 🃏 Blackjack – hit / stand
    if (['hit', 'stand'].includes(interaction.customId)) {
      const game = activeBlackjackGames.get(userId);
      if (!game) return interaction.reply({ content: '❌ No active game.', ephemeral: true });

      if (interaction.customId === 'hit') game.player.push(drawCard());
      const playerPts = calculatePoints(game.player);

      if (interaction.customId === 'hit' && playerPts > 21) {
        activeBlackjackGames.delete(userId);
        log(userId, `Blackjack BUST -${game.wager}`);
        return interaction.reply({ content: `💥 You busted with ${playerPts} points. Lost ${game.wager} coins.`, ephemeral: true });
      }

      if (interaction.customId === 'stand' || playerPts > 21) {
        while (calculatePoints(game.dealer) < 17) game.dealer.push(drawCard());
        const dealerPts = calculatePoints(game.dealer);

        let result = `🧑 You: ${playerPts} vs 🤖 Dealer: ${dealerPts}\n`;
        if (playerPts > 21 || (dealerPts <= 21 && dealerPts > playerPts)) {
          result += `😢 You lost ${game.wager} coins.`;
          log(userId, `Blackjack LOSS -${game.wager}`);
        } else if (playerPts === dealerPts) {
          addCoins(userId, game.wager);
          result += `🤝 It's a tie. You got your ${game.wager} coins back.`;
          log(userId, `Blackjack TIE refunded`);
        } else {
          addCoins(userId, game.wager * 2);
          result += `🎉 You win ${game.wager * 2} coins!`;
          log(userId, `Blackjack WIN +${game.wager * 2}`);
        }

        activeBlackjackGames.delete(userId);
        return interaction.reply({ content: result, ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('hit').setLabel('➕ Hit').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('stand').setLabel('🛑 Stand').setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setDescription(`Your hand: ${game.player.join(', ')} (${playerPts} pts)\nDealer shows: ${game.dealer[0]}`)
        .setColor(0x5865f2);

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // 🎡 Roulette
    if (interaction.customId === 'roulette') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('roul_10').setLabel('🎡 Bet 10').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('roul_25').setLabel('🎡 Bet 25').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('roul_50').setLabel('🎡 Bet 50').setStyle(ButtonStyle.Success)
      );
      return interaction.reply({ content: '🎯 Choose your bet amount for Roulette:', components: [row], ephemeral: true });
    }

    if (interaction.customId.startsWith('roul_')) {
      const wager = parseInt(interaction.customId.split('_')[1]);
      if (getBalance(userId) < wager) return interaction.reply({ content: t(userId, 'not_enough'), ephemeral: true });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`roll_red_${wager}`).setLabel('🔴 Red').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`roll_black_${wager}`).setLabel('⚫ Black').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`roll_green_${wager}`).setLabel('🟢 Green').setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ content: '🎨 Choose a color:', components: [row], ephemeral: true });
    }

    if (interaction.customId.startsWith('roll_')) {
      const [_, color, amount] = interaction.customId.split('_');
      const wager = parseInt(amount);
      if (getBalance(userId) < wager) return interaction.reply({ content: t(userId, 'not_enough'), ephemeral: true });

      removeCoins(userId, wager);
      const outcome = Math.floor(Math.random() * 38); // 0–37
      let resultColor = outcome === 0 ? 'green' : outcome <= 18 ? 'red' : 'black';
      let payout = 0;

      if (color === resultColor) {
        payout = color === 'green' ? wager * 14 : wager * 2;
        addCoins(userId, payout);
      }

      const displayColor = resultColor === 'red' ? '🔴 Red' : resultColor === 'black' ? '⚫ Black' : '🟢 Green';
      const win = payout > 0;

      log(userId, `Roulette ${color.toUpperCase()} ${win ? 'WIN' : 'LOSS'} ${win ? '+' + payout : '-' + wager}`);

      const embed = new EmbedBuilder()
        .setTitle('🎡 Roulette')
        .setDescription(`Result: **${displayColor}**\n${win ? `🎉 You won ${payout} coins!` : `😢 You lost ${wager} coins.`}`)
        .setColor(win ? 0x00ff00 : 0xff0000);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});

client.login(token);
