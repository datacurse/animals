import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, Role, GuildMember, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Gives vegan role to a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to verify').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // Immediately defer the reply to prevent interaction timeout
    await interaction.deferReply({ ephemeral: true });

    try {
      const target = interaction.options.getUser('user')!;
      const guild = interaction.guild!;
      const member = interaction.member as GuildMember;

      // Check if the command user has the verificator role
      const hasVerificatorRole = member.roles.cache.some((role: Role) =>
        role.name.toLowerCase() === 'verificator');

      if (!hasVerificatorRole) {
        return interaction.editReply({
          content: 'You do not have the verificator role required to use this command.'
        });
      }

      // Try to verify the target user
      const result = await this.verifyUser(guild, target.id);

      if (result === 'already_verified') {
        return interaction.editReply({
          content: `${target.username} is already verified.`
        });
      } else if (result === 'success') {
        // For success message, we want it to be public
        await interaction.deleteReply(); // Delete the deferred ephemeral message
        return interaction.followUp(`${interaction.user.username} granted vegan role to ${target.username}`);
      } else {
        return interaction.editReply({
          content: 'Failed to verify user (role not found or other error).'
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply({
        content: 'An error occurred while verifying the user.'
      });
    }
  },

  // Helper function
  async verifyUser(guild: Guild, userId: string): Promise<'success' | 'already_verified' | 'failed'> {
    try {
      // Get the member
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return 'failed';

      // Find vegan role
      const veganRole = guild.roles.cache.find((role: Role) =>
        role.name.toLowerCase() === 'vegan');
      if (!veganRole) return 'failed';

      // Check if user already has the vegan role
      if (member.roles.cache.has(veganRole.id)) {
        return 'already_verified';
      }

      // Add vegan role
      await member.roles.add(veganRole);
      return 'success';
    } catch (error) {
      console.error(error);
      return 'failed';
    }
  }
}
