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

const activeBlackjackGames = new Map();

function drawCard() {
  const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  return values[Math.floor(Math.random() * values.length)];
}

function calculatePoints(hand) {
  let points = 0, aces = 0;
  for (const card of hand) {
    if (['J','Q','K'].includes(card)) points += 10;
    else if (card === 'A') { points += 11; aces++; }
    else points += parseInt(card);
  }
  while (points > 21 && aces-- > 0) points -= 10;
  return points;
}

module.exports = {
  showBetModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('bj_bet_modal')
      .setTitle('🃏 Blackjack')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('bj_bet_amount')
            .setLabel('Enter your bet amount')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. 100')
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  },

  async startGame(interaction) {
    const userId = interaction.user.id;
    const input = interaction.fields.getTextInputValue('bj_bet_amount');
    const wager = parseInt(input);

    if (isNaN(wager) || wager <= 0 || getBalance(userId) < wager) {
      return interaction.reply({ content: '❌ Invalid or insufficient funds.', flags: MessageFlags.Ephemeral });
    }

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

    return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  },

  async handleAction(interaction) {
    const userId = interaction.user.id;
    const game = activeBlackjackGames.get(userId);
    if (!game) return interaction.reply({ content: '❌ No active game.', flags: MessageFlags.Ephemeral });

    if (interaction.customId === 'hit') {
      game.player.push(drawCard());
    }

    const playerPts = calculatePoints(game.player);

    if (playerPts > 21 || interaction.customId === 'stand') {
      while (calculatePoints(game.dealer) < 17) {
        game.dealer.push(drawCard());
      }

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
      return interaction.reply({ content: result, flags: MessageFlags.Ephemeral });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hit').setLabel('➕ Hit').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stand').setLabel('🛑 Stand').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle('🃏 Blackjack')
      .setDescription(`Your hand: ${game.player.join(', ')} (${playerPts} pts)\nDealer shows: ${game.dealer[0]}`)
      .setColor(0x5865f2);

    return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }
};
