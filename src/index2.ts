import 'dotenv/config';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  Interaction,
} from 'discord.js';

// Import commands explicitly
import ping from './commands/ping';
import owoify from './commands/owoify';
import verify from './commands/verify';
import renameChannel from './commands/rename-channel';
import { CONFIG } from './config';

// Load environment variables
const BOT_TOKEN = CONFIG.BOT_TOKEN!;
const BOT_ID = CONFIG.BOT_ID!;

// Create a more flexible Command interface to handle different interaction types
interface Command {
  data: {
    name: string;
    toJSON: () => any;
  };
  execute: (interaction: Interaction) => Promise<any>;
  // Add any additional methods that might be in your commands
  [key: string]: any;
}

async function main() {
  // Create client instance
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  // Create a new collection for commands
  const commands = new Collection<string, Command>();

  // Create commands array
  const commandList = [ping, owoify, verify, renameChannel];

  // Register all commands
  for (const command of commandList) {
    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
      console.log(`Registered command: ${command.data.name}`);
    } else {
      console.log(`[WARNING] A command is missing a required "data" or "execute" property.`);
    }
  }

  // Register slash commands with Discord
  const rest = new REST().setToken(BOT_TOKEN);
  try {
    console.log('Started refreshing application commands.');
    await rest.put(
      Routes.applicationCommands(BOT_ID),
      { body: commandList.map(cmd => cmd.data.toJSON()) }
    );
    console.log('Successfully reloaded application commands.');
  } catch (error) {
    console.error('Error refreshing application commands:', error);
  }

  // Handle all types of interactions
  client.on(Events.InteractionCreate, async interaction => {
    let command;

    if (interaction.isChatInputCommand()) {
      command = commands.get(interaction.commandName);
    } else if (interaction.isMessageContextMenuCommand()) {
      command = commands.get(interaction.commandName);
      console.log(`Context menu command triggered: ${interaction.commandName}`);
    } else {
      return; // Not a command we handle
    }

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);

      try {
        if (interaction.replied) {
          await interaction.followUp({
            content: 'There was an error executing this command!',
            ephemeral: true
          });
        } else if (interaction.deferred) {
          await interaction.editReply('There was an error executing this command!');
        } else {
          await interaction.reply({
            content: 'There was an error executing this command!',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('Failed to respond to interaction after error:', replyError);
      }
    }
  });

  // Handle process errors to prevent crashes
  process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
  });

  // Log in to Discord
  client.on(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  });

  await client.login(BOT_TOKEN);
}

main().catch(error => {
  console.error('Fatal error in main process:', error);
});

