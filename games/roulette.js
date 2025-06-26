const {
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const { getBalance, addCoins, removeCoins } = require('../utils/coins');
const { log } = require('../utils/logger');
const { t } = require('../utils/lang');

module.exports = {
  showBetModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('roulette_bet_modal')
      .setTitle('🎡 Roulette')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('roulette_bet_amount')
            .setLabel('Enter your bet amount')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. 100')
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  },

  async chooseColor(interaction) {
    const userId = interaction.user.id;
    const input = interaction.fields.getTextInputValue('roulette_bet_amount');
    const wager = parseInt(input);

    if (isNaN(wager) || wager <= 0 || getBalance(userId) < wager) {
      return interaction.reply({ content: '❌ Invalid or insufficient funds.', flags: MessageFlags.Ephemeral });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`roll_red_${wager}`).setLabel('🔴 Red').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`roll_black_${wager}`).setLabel('⚫ Black').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`roll_green_${wager}`).setLabel('🟢 Green').setStyle(ButtonStyle.Success)
    );

    return interaction.reply({ content: '🎨 Choose a color:', components: [row], flags: MessageFlags.Ephemeral });
  },

  async roll(interaction, color, wager) {
    const userId = interaction.user.id;
    if (getBalance(userId) < wager) {
      return interaction.reply({ content: t(userId, 'not_enough'), flags: MessageFlags.Ephemeral });
    }

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

    await interaction.reply({ embeds: [embed] });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10_000);
  }
};
