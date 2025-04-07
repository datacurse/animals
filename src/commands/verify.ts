import { SlashCommandBuilder, ChatInputCommandInteraction, Guild, GuildMember } from 'discord.js';

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
      // Get command target and guild
      const target = interaction.options.getUser('user');
      const guild = interaction.guild;
      
      // Validate basic requirements
      if (!target) {
        return interaction.editReply({ content: 'Error: Target user not found.' });
      }
      
      if (!guild) {
        return interaction.editReply({ content: 'Error: Command must be used in a guild.' });
      }
      
      // Check if the command user has the verificator role
      const member = interaction.member as GuildMember;
      const hasVerificatorRole = member.roles.cache.some(role => {
        // Just check if the string contains the text we're looking for
        return role.name.toLowerCase().includes('verificator');
      });
      
      if (!hasVerificatorRole) {
        return interaction.editReply({
          content: 'Error: You do not have the verificator role required to use this command.'
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
      
      // Log all roles for debugging
      console.log('Looking for vegan role among:', 
        guild.roles.cache.map(r => `${r.name} (${r.name.toLowerCase()})`));
      
      // Find vegan role
      const veganRole = guild.roles.cache.find(role => {
        // Just check if the string contains the text we're looking for
        return role.name.toLowerCase().includes('vegan') && 
               !role.name.toLowerCase().includes('non') && 
               !role.name.toLowerCase().includes('anti');
      });
      
      if (!veganRole) {
        return interaction.editReply({
          content: 'Error: Could not find a "vegan" role. Please check that the role exists with the correct name.'
        });
      }
      
      // Check if user already has the role
      if (targetMember.roles.cache.has(veganRole.id)) {
        return interaction.editReply({
          content: `${target.username} already has the vegan role.`
        });
      }
      
      // Find and remove non-vegan role if exists
      const nonVeganRole = guild.roles.cache.find(role => 
        role.name.toLowerCase().includes('non vegan'));
        
      if (nonVeganRole && targetMember.roles.cache.has(nonVeganRole.id)) {
        try {
          await targetMember.roles.remove(nonVeganRole);
          console.log(`Removed non-vegan role from ${target.username}`);
        } catch (removeError) {
          console.error(`Failed to remove non-vegan role from ${target.username}:`, removeError);
          // Continue with adding vegan role even if removing non-vegan fails
        }
      }
      
      // Add the role
      try {
        await targetMember.roles.add(veganRole);
        
        // For success message, we want it to be public
        await interaction.deleteReply(); // Delete the deferred ephemeral message
        return interaction.followUp(`${interaction.user.username} granted vegan role to ${target.username}`);
      } catch (roleError) {
        console.error(`Failed to add role to ${target.username}:`, roleError);
        return interaction.editReply({
          content: `Error adding role: ${roleError instanceof Error ? roleError.message : 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Command execution error:', error);
      return interaction.editReply({
        content: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
}
