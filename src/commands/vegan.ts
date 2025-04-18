import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { addRole, checkPermission, ckeckRedundancy, getGuildMember, getInteractionContext, getRole, removeRoles } from '@/utils';

const ROLES = {
  vegan: 'vegan',
  goingVegan: 'going vegan',
  notVeganYet: 'not vegan (yet)',
  verifier: 'verifier'
}
const ROLE = ROLES.vegan
const PERMISSION_ROLE = ROLES.verifier
const ROLES_TO_REMOVE = [ROLES.notVeganYet, ROLES.goingVegan]

export default {
  data: new SlashCommandBuilder()
    .setName(ROLE)
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
      checkPermission(member, PERMISSION_ROLE)
      ckeckRedundancy(member, ROLE);
      const targetUser = options.getUser('target', true)
      const targetMember = await getGuildMember(guild, targetUser);
      removeRoles(targetMember, ROLES_TO_REMOVE)
      const veganRole = getRole(guild, ROLE);
      await addRole(targetMember, veganRole);
      return i.editReply(
        `🌱 ${targetMember} was blessed with the **${ROLE}** role!`
      );
    } catch (error) {
      return i.editReply(`❌ ${error instanceof Error ? error.message : error}`);
    }
  },
};

