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
// Make sure the user ID is not undefined
const USER_ID = CONFIG.USER_ID;
if (!USER_ID) {
  console.error('Error: YOUR_USER_ID is not defined in the .env file');
  process.exit(1);
}

client.once('ready', () => {
  console.log('Bot is ready!');
  removeAdminRoles().then(() => {
    console.log('Operation completed. You can now stop the bot.');
    // Optional: Uncomment to make the bot exit after removing roles
    // process.exit(0);
  });
});

// Function to remove admin roles from the specified user in all guilds
async function removeAdminRoles() {
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.log('Bot is not in any guilds.');
      return;
    }

    console.log(`Checking ${guilds.size} guild(s) for admin roles...`);
    let totalRolesRemoved = 0;

    // Process each guild
    for (const guild of guilds.values()) {
      try {
        console.log(`Checking guild: ${guild.name} (${guild.id})`);
        // Use type assertion to tell TypeScript that YOUR_USER_ID is definitely a string
        const member = await guild.members.fetch(USER_ID as string).catch(() => null);

        if (!member) {
          console.log(`User is not a member of guild: ${guild.name}`);
          continue;
        }

        // Find admin roles the user has
        const adminRoles = member.roles.cache.filter(role =>
          role.permissions.has(BigInt(0x0000000000000008)) // ADMINISTRATOR permission
        );

        if (adminRoles.size === 0) {
          console.log(`No admin roles found in guild: ${guild.name}`);
          continue;
        }

        // Remove admin roles
        console.log(`Found ${adminRoles.size} admin role(s) in guild: ${guild.name}`);
        for (const role of adminRoles.values()) {
          await member.roles.remove(role);
          console.log(`Removed role: ${role.name} (${role.id})`);
          totalRolesRemoved++;
        }
      } catch (error) {
        console.error(`Error processing guild ${guild.name}:`, error);
      }
    }

    console.log(`Total admin roles removed: ${totalRolesRemoved}`);
  } catch (error) {
    console.error('Error in removeAdminRoles:', error);
  }
}

client.login(BOT_TOKEN);
