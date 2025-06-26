const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const { ownerId } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Send the casino button panel (owner only)'),

  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: '❌ You are not authorized.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎰 Casino Panel')
      .setDescription('Choose a game to play or check your balance!')
      .setColor(0x0099ff);

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('slot').setLabel('🎰 Slot Machine').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('blackjack').setLabel('🃏 Blackjack').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('roulette').setLabel('🎡 Roulette').setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('balance').setLabel('💰 Balance').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('daily').setLabel('🎁 Daily Bonus').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('leaderboard').setLabel('🏆 Leaderboard').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2] });
  }
};
