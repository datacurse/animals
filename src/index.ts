import 'dotenv/config';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  Interaction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
} from 'discord.js';

// Import your commands
import ping from './commands/ping';
import owoify from './commands/owoify';
import vegan from './commands/vegan';
import renameChannel from './commands/rename-channel';
import renameCategory from './commands/rename-category';
import nonVegan from './commands/non-vegan';
import isolate from './commands/isolate';
import release from './commands/release';
import tapify from './commands/tapify';

import { CONFIG } from './config';
const { TOKEN, APP_ID } = CONFIG;

// A command can be either a slash command or a context-menu command
export type Command =
  | {
      data: { name: string; toJSON(): any };
      execute(interaction: ChatInputCommandInteraction): Promise<any>;
      [key: string]: any;
    }
  | {
      data: { name: string; toJSON(): any };
      execute(interaction: MessageContextMenuCommandInteraction): Promise<any>;
      [key: string]: any;
    };

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const commands = new Collection<string, Command>();
  const commandList: Command[] = [
    ping,
    owoify,
    vegan,
    renameChannel,
    renameCategory,
    nonVegan,
    isolate,
    release,
    tapify,
  ];

  // Register commands locally
  for (const cmd of commandList) {
    commands.set(cmd.data.name, cmd);
    console.log(`Registered command: ${cmd.data.name}`);
  }

  // Register slash/context commands with Discord
  const rest = new REST().setToken(TOKEN!);
  try {
    console.log('Started refreshing application commands.');
    await rest.put(Routes.applicationCommands(APP_ID!), {
      body: commandList.map((c) => c.data.toJSON()),
    });
    console.log('Successfully reloaded application commands.');
  } catch (error) {
    console.error('Error refreshing application commands:', error);
  }

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const cmd = commands.get(interaction.commandName);
      if (!cmd) {
        console.error(`No slash command matching ${interaction.commandName}`);
        return;
      }
      try {
        await (cmd as { execute(i: ChatInputCommandInteraction): Promise<any> }).execute(
          interaction
        );
      } catch (err) {
        console.error(`Error executing ${interaction.commandName}:`, err);
        const reply = interaction.replied || interaction.deferred
          ? interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true })
          : interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        await reply;
      }

    } else if (interaction.isMessageContextMenuCommand()) {
      const cmd = commands.get(interaction.commandName);
      if (!cmd) {
        console.error(`No context-menu command matching ${interaction.commandName}`);
        return;
      }
      try {
        await (
          cmd as { execute(i: MessageContextMenuCommandInteraction): Promise<any> }
        ).execute(interaction);
      } catch (err) {
        console.error(`Error executing ${interaction.commandName}:`, err);
        const reply = interaction.replied || interaction.deferred
          ? interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true })
          : interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        await reply;
      }
    }
  });

  client.on(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled promise rejection:', err);
  });

  await client.login(TOKEN!);
}

main().catch((err) => {
  console.error('Fatal error in main process:', err);
});

