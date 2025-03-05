import 'dotenv/config';
import { Client, Guild, ChannelType, GatewayIntentBits } from 'discord.js';
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

client.once('ready', async () => {
  console.log('Bot is ready!');

  try {
    const guild: Guild = await client.guilds.create({ name: 'My Democratic Server' });
    console.log(`Guild created: ${guild.id}`);

    const channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
    if (channel) {
      const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });
      console.log(`Join the server with this invite: ${invite.url}`);
    }
  } catch (error) {
    console.error('Error creating guild:', error);
  }
});

client.on('guildMemberAdd', async member => {
  if (member.id === USER_ID) {
    try {
      const adminRole = await member.guild.roles.create({
        name: 'Admin',
        permissions: [BigInt(0x0000000000000008)],
        reason: 'Admin role for the developer'
      });

      await member.roles.add(adminRole);
      console.log('Admin role assigned to you!');
    } catch (error) {
      console.error('Error assigning admin role:', error);
    }
  }
});

client.login(BOT_TOKEN);
