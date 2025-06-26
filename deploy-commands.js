const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, clientId } = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the casino panel (Owner only)'),
  new SlashCommandBuilder()
    .setName('givecoins')
    .setDescription('Give coins to a user (Owner only)')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Target user')
        .setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Amount')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your preferred language')
    .addStringOption(opt =>
      opt.setName('lang')
        .setDescription('Choose language')
        .addChoices(
          { name: 'English', value: 'en' },
          { name: 'Norsk', value: 'no' }
        )
        .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands }
  );
  console.log('✅ Slash commands deployed!');
})();
