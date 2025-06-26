const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`🔁 Refreshing ${commands.length} application (/) commands...`);
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log('✅ Slash commands deployed!');
  } catch (error) {
    console.error('❌ Error while deploying commands:', error);
  }
})();
