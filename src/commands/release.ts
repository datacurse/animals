import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, Role, GuildMember } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Releases a user from isolation')
    .addUserOption(option =>
      option.setName('user').setDescription('User to release from isolation').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Use deferReply to handle potential delays
      await interaction.deferReply();

      const target = interaction.options.getUser('user')!;
      const guild = interaction.guild!;

      // Execute release
      const success = await this.releaseUser(guild, target.id);
      return interaction.editReply(success
        ? `${target.username} has been released from isolation.`
        : 'Failed to release user (not isolated or missing role).');
    } catch (error) {
      console.error('Error executing release command:', error);

      // Handle reply based on interaction state
      try {
        if (interaction.deferred) {
          return interaction.editReply('An error occurred while releasing the user.');
        } else if (!interaction.replied) {
          return interaction.reply({
            content: 'An error occurred while releasing the user.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('Failed to respond to release command:', replyError);
      }
    }
  },

  // Helper function
  async releaseUser(guild: Guild, userId: string): Promise<boolean> {
    try {
      // Get the member
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return false;

      // Find isolated role
      const isolatedRole = guild.roles.cache.find((role: Role) => role.name.toLowerCase() === 'isolated');
      if (!isolatedRole) return false;

      // Check if user has the isolated role
      if (!member.roles.cache.has(isolatedRole.id)) return false;

      // Remove the isolated role
      await member.roles.remove(isolatedRole);

      // Restore previous roles if they exist
      const previousRoles = (member as any)._previousRoles;
      if (previousRoles && previousRoles.length > 0) {
        await member.roles.add(previousRoles);
        delete (member as any)._previousRoles;
      }

      return true;
    } catch (error) {
      console.error('Error in releaseUser function:', error);
      return false;
    }
  }
}
