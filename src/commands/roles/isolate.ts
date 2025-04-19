import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Guild,
  GuildMember
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('isolate')
    .setDescription('Isolates a user by assigning the isolated role')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to isolate')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // Public defer; gives us time to fetch roles, etc.
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user', true);
    const guild = interaction.guild;
    if (!guild) {
      return interaction.followUp({
        content: '❌ This command must be used in a server.',
        ephemeral: true
      });
    }

    // “Bot revenge” shortcut
    if (targetUser.id === interaction.client.user!.id) {
      const youIsolated = await this.isolateUser(guild, interaction.user.id);
      return interaction.editReply({
        content: youIsolated
          ? `😈 You tried to isolate me, but I isolated YOU instead!`
          : `😅 Nice try—couldn’t isolate you either.`
      });
    }

    // Fetch the target member
    let member: GuildMember;
    try {
      member = await guild.members.fetch(targetUser.id);
    } catch {
      return interaction.followUp({
        content: `❌ Could not find **${targetUser.username}** in this server.`,
        ephemeral: true
      });
    }

    // Check for “vegan” role
    const hasVegan = member.roles.cache.some(role =>
      role.name.toLowerCase().includes('vegan') &&
      !role.name.toLowerCase().includes('non') &&
      !role.name.toLowerCase().includes('anti')
    );
    if (hasVegan) {
      return interaction.editReply({
        content: `🌱 I can’t isolate **${targetUser.username}** because they’re a vegan.`
      });
    }

    // Perform the isolation
    const success = await this.isolateUser(guild, member.id);
    if (success) {
      return interaction.editReply({
        content: `🔒 **${targetUser.username}** has been isolated.`
      });
    } else {
      return interaction.editReply({
        content: `⚠️ **${targetUser.username}** is already isolated or I couldn’t find the isolated role.`
      });
    }
  },

  // Helper method: adds the “isolated” role and removes all others
  async isolateUser(guild: Guild, userId: string): Promise<boolean> {
    let member: GuildMember;
    try {
      member = await guild.members.fetch(userId);
    } catch {
      return false;
    }

    // Find the “isolated” role
    const isolatedRole = guild.roles.cache.find(r =>
      r.name.toLowerCase().includes('isolated')
    );
    if (!isolatedRole) {
      console.error('Isolated role not found');
      return false;
    }

    // Skip if already isolated
    if (member.roles.cache.has(isolatedRole.id)) {
      return false;
    }

    // Remove all roles except @everyone and isolated
    const rolesToRemove = member.roles.cache
      .filter(r => r.id !== guild.id && r.id !== isolatedRole.id)
      .map(r => r.id);

    // Apply isolation
    await member.roles.add(isolatedRole);
    if (rolesToRemove.length) {
      await member.roles.remove(rolesToRemove);
    }

    return true;
  }
};

