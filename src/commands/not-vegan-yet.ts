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

    // Find roles
    const veganRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'vegan');
    const goingVeganRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'going vegan');
    const animalAbuserRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'animal abuser');

    if (!animalAbuserRole) {
      return interaction.editReply('❌ No role named "animal abuser" found. Please create it first.');
    }

    // Prevent “demoting” a vegan
    if (veganRole && targetMember.roles.cache.has(veganRole.id)) {
      return interaction.editReply(
        '❌ That person is already vegan. If you have any issues, please ping the moderators.'
      );
    }

    // Already animal abuser?
    if (targetMember.roles.cache.has(animalAbuserRole.id)) {
      return interaction.editReply(`✅ ${targetMember} is already an animal abuser.`);
    }

    try {
      // Remove only “going vegan” (if present)
      if (goingVeganRole && targetMember.roles.cache.has(goingVeganRole.id)) {
        await targetMember.roles.remove(goingVeganRole);
      }

      // Add animal abuser role
      await targetMember.roles.add(animalAbuserRole);

      // 2) Replace the deferred “thinking…” with a **public** message
      return interaction.editReply({
        content: `🤦 ${targetMember} has been marked as **animal abuser**.`
      });
    } catch (error) {
      console.error('Role update failed:', error);
      return interaction.editReply(
        `❌ Something went wrong: ${error instanceof Error ? error.message : error}`
      );
    }
  },
};

