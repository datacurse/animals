import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, GuildMember } from 'discord.js';

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
      
      const target = interaction.options.getUser('user');
      const guild = interaction.guild;
      
      // Validate basic requirements
      if (!target) {
        return interaction.editReply({ content: 'Error: Target user not found.' });
      }
      
      if (!guild) {
        return interaction.editReply({ content: 'Error: Command must be used in a guild.' });
      }
      
      // Get target member
      const targetMember = await guild.members.fetch(target.id).catch(error => {
        console.error(`Failed to fetch member ${target.id}:`, error);
        return null;
      });
      
      if (!targetMember) {
        return interaction.editReply({
          content: `Error: Could not find ${target.username} in this server.`
        });
      }
      
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
      const member = await guild.members.fetch(userId).catch(error => {
        console.error(`Failed to fetch member ${userId}:`, error);
        return null;
      });
      
      if (!member) return false;
      
      // Find isolated role using includes instead of exact match
      const isolatedRole = guild.roles.cache.find(role => 
        role.name.toLowerCase().includes('isolated'));
        
      if (!isolatedRole) {
        console.error('Isolated role not found');
        return false;
      }
      
      // Check if user has the isolated role
      if (!member.roles.cache.has(isolatedRole.id)) {
        console.log(`User ${userId} is not isolated`);
        return false;
      }
      
      // Remove the isolated role
      await member.roles.remove(isolatedRole);
      console.log(`Removed isolated role from user ${userId}`);
      
      // Restore previous roles if they exist
      const previousRoles = (member as any)._previousRoles;
      if (previousRoles && previousRoles.length > 0) {
        console.log(`Restoring ${previousRoles.length} roles to user ${userId}`);
        await member.roles.add(previousRoles);
        delete (member as any)._previousRoles;
      } else {
        console.log(`No previous roles found for user ${userId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error in releaseUser function:', error);
      return false;
    }
  }
}
