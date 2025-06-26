const { 
  SlashCommandBuilder,
  MessageFlags
} = require('discord.js');
const { ownerId } = require('../config');
const { addCoins } = require('../utils/coins');
const { log } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givecoins')
    .setDescription('Give virtual coins to a user (owner only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give coins to')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of coins to give')
        .setRequired(true)),

  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: '❌ You are not authorized.', flags: MessageFlags.Ephemeral });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    addCoins(user.id, amount);
    log(interaction.user.id, `GAVE ${amount} coins to ${user.tag}`);
    log(user.id, `RECEIVED ${amount} coins from owner`);

    await interaction.reply({ content: `✅ Gave ${amount} coins to ${user.tag}` });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10_000);
  }
};
