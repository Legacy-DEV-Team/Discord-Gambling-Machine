const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const { getBalance, addCoins, getTopBalances } = require('../utils/coins');
const { canClaim, claimBonus } = require('../utils/daily');
const { log } = require('../utils/logger');
const { setLang, t } = require('../utils/lang');

const slot = require('../games/slot');
const blackjack = require('../games/blackjack');
const roulette = require('../games/roulette');

// Dynamisk lasting av kommandoer
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(`../commands/${file}`);
  if (cmd.data?.name && typeof cmd.execute === 'function') {
    commands.set(cmd.data.name, cmd);
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const userId = interaction.user.id;

    // Håndter slash-kommandoer
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ An error occurred while executing this command.', flags: MessageFlags.Ephemeral });
      }
    }

    // Håndter knapper
    if (interaction.isButton()) {
      if (interaction.customId === 'slot') return slot.showBetModal(interaction);
      if (interaction.customId === 'blackjack') return blackjack.showBetModal(interaction);
      if (interaction.customId === 'roulette') return roulette.showBetModal(interaction);

      if (interaction.customId === 'balance') {
        const balance = getBalance(userId);
        return interaction.reply({ content: t(userId, 'balance', { amount: balance }), flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'daily') {
        if (!canClaim(userId)) {
          return interaction.reply({ content: t(userId, 'daily_claimed'), flags: MessageFlags.Ephemeral });
        }

        const { amount, streak } = claimBonus(userId);
        addCoins(userId, amount);
        log(userId, `Claimed daily bonus +${amount} (Streak ${streak})`);

        return interaction.reply({ content: t(userId, 'daily_bonus', { amount, streak }), flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'leaderboard') {
        const top = getTopBalances();
        const lines = await Promise.all(top.map(async (entry, i) => {
          const user = await interaction.client.users.fetch(entry.id).catch(() => null);
          const name = user ? user.tag : `User ${entry.id}`;
          return `**#${i + 1}** – ${name}: ${entry.balance} coins`;
        }));

        const embed = new EmbedBuilder()
          .setTitle(t(userId, 'leaderboard_title'))
          .setDescription(lines.join('\n'))
          .setColor(0xf1c40f);

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'hit' || interaction.customId === 'stand') {
        return blackjack.handleAction(interaction);
      }

      if (interaction.customId.startsWith('roll_')) {
        const [_, color, amount] = interaction.customId.split('_');
        const wager = parseInt(amount);
        return roulette.roll(interaction, color, wager);
      }
    }

    // Håndter modal-input
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'slot_bet_modal') return slot.play(interaction);
      if (interaction.customId === 'bj_bet_modal') return blackjack.startGame(interaction);
      if (interaction.customId === 'roulette_bet_modal') return roulette.chooseColor(interaction);
    }
  }
};
