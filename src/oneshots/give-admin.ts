import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { CONFIG } from '@/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const BOT_TOKEN = CONFIG.BOT_TOKEN;
const USER_ID = CONFIG.USER_ID;
const GUILD_ID = CONFIG.GUILD_ID;
const ADMIN_ROLE_NAME = 'Admin'; // Name of your existing admin role

client.once('ready', () => {
  console.log('Bot is ready!');
  assignExistingAdminRole().then(() => {
    console.log('Operation completed. You can now stop the bot.');
  });
});

async function assignExistingAdminRole() {
  if (!BOT_TOKEN || !USER_ID || !GUILD_ID) {
    console.error('Missing required environment variables');
    process.exit(0);
  }

  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      console.error(`Guild with ID ${GUILD_ID} not found.`);
      return;
    }

    const member = await guild.members.fetch(USER_ID).catch(() => null);
    if (!member) {
      console.error(`User with ID ${USER_ID} not found in guild: ${guild.name}`);
      return;
    }

    // Find the existing admin role
    const adminRole = guild.roles.cache.find(role =>
      role.name === ADMIN_ROLE_NAME || role.permissions.has('0x0000000000000008')
    );

    if (!adminRole) {
      console.error(`Admin role '${ADMIN_ROLE_NAME}' not found in guild: ${guild.name}`);
      return;
    }

    // Check if the user already has the admin role
    if (member.roles.cache.has(adminRole.id)) {
      console.log(`User already has the admin role in guild: ${guild.name}`);
      return;
    }

    // Assign the admin role to the user
    await member.roles.add(adminRole);
    console.log(`Assigned existing admin role to user in guild: ${guild.name}`);

  } catch (error) {
    console.error('Error in assignExistingAdminRole:', error);
  }
}

client.login(BOT_TOKEN);
