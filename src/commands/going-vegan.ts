import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { addRole, checkPermission, ckeckRedundancy, getGuildMember, getInteractionContext, getRole, hyphenateRole, protectRoles, removeRoles } from '@/utils';
import { ROLES } from '@/config';

const ROLE = ROLES.goingVegan
const COMMAND_NAME = hyphenateRole(ROLE);
const PERMISSION = ROLES.verifier
const PROTECT = [ROLES.vegan]
const REMOVE = [ROLES.notVeganYet]

export default {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(`Gives ${ROLE} role to a target user`)
    .addUserOption(opt => opt
      .setName('target')
      .setDescription(`Target user to verify as ${ROLE}`)
      .setRequired(true)
    ),
  async execute(i: ChatInputCommandInteraction) {
    try {
      await i.deferReply();
      const {member, guild, options} = getInteractionContext(i)
      checkPermission(member, PERMISSION)
      const targetUser = options.getUser('target', true)
      const targetMember = await getGuildMember(guild, targetUser);
      protectRoles(targetMember, PROTECT)
      ckeckRedundancy(targetMember, ROLE);
      await removeRoles(targetMember, REMOVE)
      await addRole(targetMember, getRole(guild, ROLE));
      await i.editReply(`🌱 ${targetMember} was blessed with the ${ROLE} role!`);
    } catch (error) {
      await i.editReply(`❌ ${error instanceof Error ? error.message : error}`);
    }
  },
};


