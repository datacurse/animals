import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, GuildMember } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('isolate')
    .setDescription('Isolates a user by assigning the isolated role')
    .addUserOption(option =>
      option.setName('user').setDescription('User to isolate').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Use deferReply to handle potential delays - make it ephemeral for errors
      await interaction.deferReply({ ephemeral: true });
      
      const target = interaction.options.getUser('user');
      const guild = interaction.guild;
      
      // Validate basic requirements
      if (!target) {
        return interaction.editReply({ content: 'Error: Target user not found.' });
      }
      
      if (!guild) {
        return interaction.editReply({ content: 'Error: Command must be used in a guild.' });
      }
      
      // Bot revenge case
      if (target.id === interaction.client.user!.id) {
        const success = await this.isolateUser(guild, interaction.user.id);
        // Make this public since it's a fun response, not an error
        return interaction.editReply({
          content: success
            ? `You tried to isolate me, but I isolated YOU instead, ${interaction.user.username}!`
            : 'You got lucky this time!',
          ephemeral: false // Make this visible to everyone
        });
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
      
      // Check if the user has the vegan role
      const hasVeganRole = targetMember.roles.cache.some(role => {
        return role.name.toLowerCase().includes('vegan') && 
               !role.name.toLowerCase().includes('non') && 
               !role.name.toLowerCase().includes('anti');
      });
      
      if (hasVeganRole) {
        return interaction.editReply({
          content: `Cannot isolate ${target.username} because they have the vegan role. The isolate command doesn't work on vegans.`
        });
      }
      
      // Normal isolate case - successful isolation should be public
      const success = await this.isolateUser(guild, target.id);
      
      // For successful isolation, make the message public
      if (success) {
        return interaction.editReply({
          content: `${target.username} has been isolated.`,
          ephemeral: false // Make successful actions visible to everyone
        });
      } else {
        return interaction.editReply({
          content: 'Failed to isolate user (already isolated or missing role).'
          // Keeps the ephemeral: true from deferReply
        });
      }
        
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
      
      // Check if user already has the isolated role
      if (member.roles.cache.has(isolatedRole.id)) {
        console.log(`User ${userId} is already isolated`);
        return false;
      }
      
      // Store original roles in a property on the member object
      const roles = member.roles.cache
        .filter(role => role.id !== guild.id)
        .map(role => role.id);
        
      // Find non-vegan role if it exists
      const nonVeganRole = guild.roles.cache.find(role => 
        role.name.toLowerCase().includes('non-vegan'));
        
      // Log roles being removed  
      console.log(`Removing ${roles.length} roles from user ${userId}`);
      if (nonVeganRole) {
        console.log(`Will ensure non-vegan role is removed from user ${userId}`);
      }
      
      // Add the isolated role first
      await member.roles.add(isolatedRole);
      
      // Remove all other roles
      if (roles.length > 0) {
        await member.roles.remove(roles);
      }
      
      // Ensure non-vegan role is removed, even if it was added after our initial check
      if (nonVeganRole) {
        await member.roles.remove(nonVeganRole.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error in isolateUser function:', error);
      return false;
    }
  }
}
