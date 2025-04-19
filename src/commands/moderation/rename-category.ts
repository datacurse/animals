import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rename-category')
    .setDescription('Rename a category')
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('The category to rename')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    )
    .addStringOption(option =>
      option.setName('new-name')
        .setDescription('The new name for the category')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(100)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    console.log(`[${new Date().toISOString()}] Command started: rename-category by ${interaction.user.tag}`);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    console.log(`[${new Date().toISOString()}] Interaction deferred`);

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const hasCreatorRole = member?.roles.cache.some(role => role.name.toLowerCase() === 'creator');
    console.log(`[${new Date().toISOString()}] User has creator role: ${hasCreatorRole}`);

    if (!hasCreatorRole) {
      console.log(`[${new Date().toISOString()}] Command rejected: User lacks creator role`);
      return interaction.editReply('You need the "creator" role to use this command.');
    }

    const selectedCategory = interaction.options.getChannel('category');
    const newName = interaction.options.getString('new-name');
    console.log(`[${new Date().toISOString()}] Selected category: ${selectedCategory?.name} (${selectedCategory?.id}), New name: ${newName}`);

    if (!selectedCategory || !newName || !interaction.guild) {
      console.log(`[${new Date().toISOString()}] Command rejected: Invalid category, name, or guild`);
      return interaction.editReply('Invalid category or name provided.');
    }

    if (selectedCategory.type !== ChannelType.GuildCategory) {
      console.log(`[${new Date().toISOString()}] Command rejected: Not a category channel`);
      return interaction.editReply('The selected channel is not a category.');
    }

    try {
      console.log(`[${new Date().toISOString()}] Attempting to fetch and rename category...`);

      // Fetch the actual category channel instance from the guild
      const category = await interaction.guild.channels.fetch(selectedCategory.id);

      if (!category) {
        console.log(`[${new Date().toISOString()}] Category not found`);
        return interaction.editReply('Category not found or cannot be accessed.');
      }

      console.log(`[${new Date().toISOString()}] Category fetched successfully, attempting rename`);
      await category.edit({
        name: newName,
        reason: `Category renamed by ${interaction.user.tag}`
      });

      console.log(`[${new Date().toISOString()}] Category successfully renamed to: ${newName}`);
      await interaction.editReply(`Category has been renamed to \`${newName}\``);
      console.log(`[${new Date().toISOString()}] Command completed successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error renaming category:`, error);
      await interaction.editReply('Failed to rename the category. Make sure I have the necessary permissions.');
      console.log(`[${new Date().toISOString()}] Command failed with error`);
    }
  }
}
