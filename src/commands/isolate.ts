import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, Role, GuildMember } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('isolate')
    .setDescription('Isolates a user by assigning the isolated role')
    .addUserOption(option =>
      option.setName('user').setDescription('User to isolate').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Use deferReply to handle potential delays
      await interaction.deferReply();

      const target = interaction.options.getUser('user')!;
      const guild = interaction.guild!;

      // Bot revenge case
      if (target.id === interaction.client.user!.id) {
        const success = await this.isolateUser(guild, interaction.user.id);
        return interaction.editReply(success
          ? `You tried to isolate me, but I isolated YOU instead, ${interaction.user.username}!`
          : 'You got lucky this time!');
      }

      // Normal isolate case
      const success = await this.isolateUser(guild, target.id);
      return interaction.editReply(success
        ? `${target.username} has been isolated.`
        : 'Failed to isolate user (already isolated or missing role).');
    } catch (error) {
      console.error('Error executing isolate command:', error);

      // Handle reply based on interaction state
      try {
        if (interaction.deferred) {
          return interaction.editReply('An error occurred while isolating the user.');
        } else if (!interaction.replied) {
          return interaction.reply({
            content: 'An error occurred while isolating the user.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('Failed to respond to isolate command:', replyError);
      }
    }
  },

  // Helper function
  async isolateUser(guild: Guild, userId: string): Promise<boolean> {
    try {
      // Get the member
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return false;

      // Find isolated role
      const isolatedRole = guild.roles.cache.find((role: Role) => role.name.toLowerCase() === 'isolated');
      if (!isolatedRole) return false;

      // Check if user already has the isolated role
      if (member.roles.cache.has(isolatedRole.id)) return false;

      // Store original roles in a property on the member object
      const roles = member.roles.cache
        .filter((role: Role) => role.id !== guild.id)
        .map((role: Role) => role.id);

      // Store the roles in a property on the user object for later retrieval
      (member as any)._previousRoles = roles;

      // Add the isolated role first, then remove the others
      await member.roles.add(isolatedRole);
      if (roles.length > 0) {
        await member.roles.remove(roles);
      }

      return true;
    } catch (error) {
      console.error('Error in isolateUser function:', error);
      return false;
    }
  }
}
