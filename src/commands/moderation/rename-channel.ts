import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rename-channel')
    .setDescription('Rename an existing channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to rename')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildCategory, ChannelType.GuildAnnouncement)
    )
    .addStringOption(option =>
      option.setName('new-name')
        .setDescription('The new name for the channel')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(100)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    console.log(`[${new Date().toISOString()}] Command started: rename-channel by ${interaction.user.tag}`);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    console.log(`[${new Date().toISOString()}] Interaction deferred`);

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const hasCreatorRole = member?.roles.cache.some(role => role.name.toLowerCase() === 'creator');
    console.log(`[${new Date().toISOString()}] User has creator role: ${hasCreatorRole}`);

    if (!hasCreatorRole) {
      console.log(`[${new Date().toISOString()}] Command rejected: User lacks creator role`);
      return interaction.editReply('You need the "creator" role to use this command.');
    }

    const selectedChannel = interaction.options.getChannel('channel');
    const newName = interaction.options.getString('new-name');
    console.log(`[${new Date().toISOString()}] Selected channel: ${selectedChannel?.name} (${selectedChannel?.id}), New name: ${newName}`);

    if (!selectedChannel || !newName || !interaction.guild) {
      console.log(`[${new Date().toISOString()}] Command rejected: Invalid channel, name, or guild`);
      return interaction.editReply('Invalid channel or name provided.');
    }

    try {
      console.log(`[${new Date().toISOString()}] Attempting to fetch and rename channel...`);

      // Fetch the actual channel instance from the guild
      const channel = await interaction.guild.channels.fetch(selectedChannel.id);

      if (!channel) {
        console.log(`[${new Date().toISOString()}] Channel not found`);
        return interaction.editReply('Channel not found or cannot be accessed.');
      }

      console.log(`[${new Date().toISOString()}] Channel fetched successfully, attempting rename`);
      await channel.edit({
        name: newName,
        reason: `Renamed by ${interaction.user.tag}`
      });

      console.log(`[${new Date().toISOString()}] Channel successfully renamed to: ${newName}`);
      await interaction.editReply(`Channel has been renamed to \`${newName}\``);
      console.log(`[${new Date().toISOString()}] Command completed successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error renaming channel:`, error);
      await interaction.editReply('Failed to rename the channel. Make sure I have the necessary permissions.');
      console.log(`[${new Date().toISOString()}] Command failed with error`);
    }
  }
}
