import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { CONFIG } from '../config';

export default {
  data: new SlashCommandBuilder()
    .setName('animal-abuser')
    .setDescription('Gives animal abuser role to a user')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User to verify as animal abuser')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    // 1) Defer (public) so we get more time
    await interaction.deferReply();

    const { member, guild, options } = interaction;
    if (!guild || !(member instanceof GuildMember)) {
      return interaction.editReply('❌ This command must be used in a server.');
    }

    // Permission check
    const isVerificator = member.roles.cache.some(r =>
      r.name.toLowerCase().includes('verificator')
    );
    const isDev = member.id === CONFIG.DEV_ID;
    if (!isVerificator && !isDev) {
      return interaction.editReply('❌ You need the verificator role to run this.');
    }

    // Fetch target
    const target = options.getUser('user', true);
    const targetMember = await guild.members.fetch(target.id).catch(() => null);
    if (!targetMember) {
      return interaction.editReply(`❌ Couldn't find ${target} here.`);
    }

    // Find animal abuser role
    const animalAbuserRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'animal abuser');
    if (!animalAbuserRole) {
      return interaction.editReply('❌ No role named "animal abuser" found. Please create it first.');
    }

    // Already animal abuser?
    if (targetMember.roles.cache.has(animalAbuserRole.id)) {
      return interaction.editReply(`✅ ${targetMember} is already animal abuser.`);
    }

    try {
      // Remove conflicting roles
      const removals = ['animal abuser', 'going vegan']
        .map(name => guild.roles.cache.find(r => r.name.toLowerCase() === name))
        .filter(r => r && targetMember.roles.cache.has(r.id))
        .map(r => targetMember.roles.remove(r!));
      await Promise.all(removals);

      // Add animal abuser role
      await targetMember.roles.add(animalAbuserRole);

      // 2) Replace the deferred “thinking…” with a **public** message
      return interaction.editReply({
        content: `🤦 ${targetMember} is an **animal abuser**.`
      });
    } catch (error) {
      console.error('Role update failed:', error);
      return interaction.editReply(
        `❌ Something went wrong: ${error instanceof Error ? error.message : error}`
      );
    }
  },
};


