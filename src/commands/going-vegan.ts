import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { CONFIG } from '../config';

export default {
  data: new SlashCommandBuilder()
    .setName('going-vegan')
    .setDescription('Gives going vegan role to a user')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User to verify as going vegan')
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

    if (!goingVeganRole) {
      return interaction.editReply('❌ No role named "going vegan" found. Please create it first.');
    }

    // Prevent “demoting” a vegan
    if (veganRole && targetMember.roles.cache.has(veganRole.id)) {
      return interaction.editReply(
        '❌ That person is already vegan. If you have any issues, please ping the moderators.'
      );
    }

    // Already going vegan?
    if (targetMember.roles.cache.has(goingVeganRole.id)) {
      return interaction.editReply(`✅ ${targetMember} is already going vegan.`);
    }

    try {
      // Remove only “animal abuser” (if present)
      const animalAbuser = guild.roles.cache.find(r => r.name.toLowerCase() === 'animal abuser');
      if (animalAbuser && targetMember.roles.cache.has(animalAbuser.id)) {
        await targetMember.roles.remove(animalAbuser);
      }

      // Add going vegan role
      await targetMember.roles.add(goingVeganRole);

      // 2) Replace the deferred “thinking…” with a **public** message
      return interaction.editReply({
        content: `🌱 ${targetMember} was blessed with the **going vegan** role!`
      });
    } catch (error) {
      console.error('Role update failed:', error);
      return interaction.editReply(
        `❌ Something went wrong: ${error instanceof Error ? error.message : error}`
      );
    }
  },
};

