import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, Role, GuildMember } from 'discord.js';

// Store stunned users
interface StunnedInfo {
  roles: string[];
  timer: NodeJS.Timeout;
}

const stunned = new Map<string, StunnedInfo>();

export default {
  data: new SlashCommandBuilder()
    .setName('stun')
    .setDescription('Temporarily mutes a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to stun').setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('duration').setDescription('Minutes (max 60, default 5 seconds)')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const target = interaction.options.getUser('user')!;
      const duration = interaction.options.getNumber('duration') ?? 0.083;
      const guild = interaction.guild!;

      // Bot revenge case
      if (target.id === interaction.client.user!.id) {
        const success = await this.stunUser(guild, interaction.user.id, duration);
        return interaction.editReply(success
          ? `um, thats not very vegan of you 👆🤓, ${interaction.user.username}! You've been stunned for ${duration} minute(s).`
          : 'You got lucky this time!');
      }

      // Normal stun case
      const success = await this.stunUser(guild, target.id, duration);
      return interaction.editReply(success
        ? `${target.username} has been stunned for ${duration} minute(s).`
        : 'Failed to stun user (already stunned or missing role).');
    } catch (error) {
      console.error(error);
      return interaction.editReply('An error occurred while stunning.');
    }
  },

  // Helper function
  async stunUser(guild: Guild, userId: string, duration: number = 0.083): Promise<boolean> {
    // Get the member
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member || stunned.has(userId)) return false;

    // Find muted role
    const mutedRole = guild.roles.cache.find((role: Role) => role.name === 'muted');
    if (!mutedRole) return false;

    // Store and remove original roles
    const roles = member.roles.cache
      .filter((role: Role) => role.id !== guild.id)
      .map((role: Role) => role.id);

    await member.roles.remove(roles);
    await member.roles.add(mutedRole);

    // Set timeout to restore roles (max 60 minutes)
    const ms = Math.min(duration * 60 * 1000, 60 * 60 * 1000);
    const timer = setTimeout(async () => {
      const info = stunned.get(userId);
      if (!info) return;

      const user = await guild.members.fetch(userId).catch(() => null);
      if (user) {
        await user.roles.remove(mutedRole);
        if (info.roles.length > 0) {
          await user.roles.add(info.roles);
        }
        stunned.delete(userId);
      }
    }, ms);

    // Store in map
    stunned.set(userId, { roles, timer });
    return true;
  },

  // Expose for unstun command
  getStunnedMap(): Map<string, StunnedInfo> {
    return stunned;
  }
}
