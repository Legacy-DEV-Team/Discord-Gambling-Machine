const {
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require('discord.js');

const { slotWinMultiplier } = require('../config');
const { getBalance, addCoins, removeCoins } = require('../utils/coins');
const { log } = require('../utils/logger');
const { t } = require('../utils/lang');

const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎'];

module.exports = {
  showBetModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('slot_bet_modal')
      .setTitle('🎰 Slot Machine')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('slot_bet_amount')
            .setLabel('Enter your bet amount')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. 100')
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  },

  async play(interaction) {
    const userId = interaction.user.id;
    const input = interaction.fields.getTextInputValue('slot_bet_amount');
    const wager = parseInt(input);

    if (isNaN(wager) || wager <= 0) {
      return interaction.reply({ content: '❌ Invalid bet amount.', flags: MessageFlags.Ephemeral });
    }

    if (getBalance(userId) < wager) {
      return interaction.reply({ content: t(userId, 'not_enough'), flags: MessageFlags.Ephemeral });
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

    await interaction.reply({ embeds: [embed] });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 10_000);
  }
};
