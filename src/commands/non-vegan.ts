import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, Role, GuildMember, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('non vegan')
    .setDescription('Gives non-vegan role to a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to mark as non-vegan').setRequired(true)
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

      // Try to assign non-vegan role to the target user
      const result = await this.assignNonVeganRole(guild, target.id);

      if (result === 'already_assigned') {
        return interaction.editReply({
          content: `${target.username} already has the non-vegan role.`
        });
      } else if (result === 'success') {
        // For success message, we want it to be public
        await interaction.deleteReply(); // Delete the deferred ephemeral message
        return interaction.followUp(`${interaction.user.username} assigned non-vegan role to ${target.username}`);
      } else {
        return interaction.editReply({
          content: 'Failed to assign non-vegan role (role not found or other error).'
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply({
        content: 'An error occurred while assigning the non-vegan role.'
      });
    }
  },

  // Helper function
  async assignNonVeganRole(guild: Guild, userId: string): Promise<'success' | 'already_assigned' | 'failed'> {
    try {
      // Get the member
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return 'failed';

      // Find non-vegan role
      const nonVeganRole = guild.roles.cache.find((role: Role) =>
        role.name.toLowerCase() === 'non vegan');
      if (!nonVeganRole) return 'failed';

      // Check if user already has the non-vegan role
      if (member.roles.cache.has(nonVeganRole.id)) {
        return 'already_assigned';
      }

      // Add non-vegan role
      await member.roles.add(nonVeganRole);
      return 'success';
    } catch (error) {
      console.error(error);
      return 'failed';
    }
  }
}
