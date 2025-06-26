const { 
  SlashCommandBuilder,
  MessageFlags
} = require('discord.js');
const { setLang } = require('../utils/lang');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your language preference')
    .addStringOption(option =>
      option.setName('lang')
        .setDescription('Language code (en or no)')
        .setRequired(true)
        .addChoices(
          { name: 'English', value: 'en' },
          { name: 'Norsk', value: 'no' }
        )),

  async execute(interaction) {
    const lang = interaction.options.getString('lang');
    setLang(interaction.user.id, lang);
    return interaction.reply({ content: `🌐 Language set to ${lang}.`, flags: MessageFlags.Ephemeral });
  }
};
