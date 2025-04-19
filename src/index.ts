import 'dotenv/config';
import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
} from 'discord.js';
import { CONFIG } from './config';

type Command = {
  data: { name: string; toJSON(): any };
  execute(
    interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction
  ): Promise<any>;
};

async function main() {
  const { TOKEN, APP_ID } = CONFIG;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  }) as Client & { commands: Collection<string, Command> };
  client.commands = new Collection();

  const commandsPath = join(__dirname, 'commands');
  for (const category of readdirSync(commandsPath)) {
    const categoryPath = join(commandsPath, category);
    for (const file of readdirSync(categoryPath)) {
      if (!'.ts'.includes(extname(file))) continue;
      const { default: cmd } = await import(join(categoryPath, file));
      client.commands.set(cmd.data.name, cmd as Command);
      console.log(`Loaded ${cmd.data.name}`);
    }
  }

  const rest = new REST().setToken(TOKEN);
  try {
    console.log('Refreshing application commands…');
    await rest.put(Routes.applicationCommands(APP_ID), {
      body: client.commands.map(c => c.data.toJSON()),
    });
    console.log('✅ Commands synced.');
  } catch (err) {
    console.error('Failed to sync commands:', err);
  }

client.on(Events.InteractionCreate, async interaction => {
  if (
    !interaction.isChatInputCommand() &&
    !interaction.isMessageContextMenuCommand()
  ) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error executing ${interaction.commandName}:`, err);
  }
});

  client.once(Events.ClientReady, () =>
    console.log(`Logged in as ${client.user!.tag}`)
  );
  process.on('unhandledRejection', console.error);

  await client.login(TOKEN);
}

main().catch(err => {
  console.error('Fatal error starting bot:', err);
  process.exit(1);
});

