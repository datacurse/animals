import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, Role } from 'discord.js';
import stun from './stun';

// Reference the StunnedInfo interface from stun.ts
interface StunnedInfo {
  roles: string[];
  timer: NodeJS.Timeout;
}

export default {
  data: new SlashCommandBuilder()
    .setName('unstun')
    .setDescription('Removes stun effect')
    .addUserOption(option =>
      option.setName('user').setDescription('User to unstun').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const target = interaction.options.getUser('user')!;
      const guild = interaction.guild!;
      const stunned = stun.getStunnedMap();

      // Check if user is stunned
      const info = stunned.get(target.id);
      if (!info) {
        return interaction.editReply('This user is not currently stunned!');
      }

      // Unstun the user
      const success = await this.unstunUser(guild, target.id, stunned);

      if (success) {
        return interaction.editReply(`${target.username} has been unstunned.`);
      } else {
        return interaction.editReply('Failed to unstun the user.');
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply('An error occurred while unstunning.');
    }
  },

  // Helper function
  async unstunUser(guild: Guild, userId: string, stunned: Map<string, StunnedInfo>): Promise<boolean> {
    const info = stunned.get(userId);
    if (!info) return false;

    // Clear timeout
    clearTimeout(info.timer);

    // Get member
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      stunned.delete(userId);
      return true; // Successfully removed from stun list
    }

    // Restore roles
    const mutedRole = guild.roles.cache.find((role: Role) => role.name === 'muted');
    if (mutedRole) {
      await member.roles.remove(mutedRole);
    }

    if (info.roles.length > 0) {
      await member.roles.add(info.roles);
    }

    // Remove from map
    stunned.delete(userId);
    return true;
  }
}
