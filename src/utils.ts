import {
  GuildMember,
  Guild,
  Role,
  User,
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
  CacheType
} from 'discord.js';

import { CONFIG } from "./config";

export function hyphenateRole(role: string): string {
  return role
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/[^\p{Ll}\p{Lm}\p{Lo}\p{N}_-]+/gu, '') 
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getInteractionContext(
  interaction: ChatInputCommandInteraction
): {
  member: GuildMember;
  guild: Guild;
  options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
} {
  const { member, guild, options } = interaction;

  if (!guild || !(member instanceof GuildMember)) {
    throw new Error('❌ This command must be used in a server.');
  }

  return { member, guild, options };
}

export async function getGuildMember(guild: Guild, user: User): Promise<GuildMember> {
  const guildMember = await guild.members.fetch(user.id).catch(() => null);
  if (!guildMember) throw new Error(`Couldn't find ${user} in the server.`);
  return guildMember
}

export function hasRole(member: GuildMember, roleName: string): boolean {
  const target = roleName.toLowerCase().trim();
  return member.roles.cache.some(r => r.name.toLowerCase().trim() === target);
}

export function getRole(guild: Guild, roleName: string): Role {
  const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName);
   if (!role) throw new Error(`No role named "${roleName}" found.`)
   return role
}

export async function addRole(member: GuildMember, role: Role) {
  await member.roles.add(role);
}

export async function removeRoleByName(member: GuildMember, roleName: string) {
  const role: Role | undefined = getRole(member.guild, roleName)
  if (!role) return
  await member.roles.remove(role)
}

export async function removeRoles(member: GuildMember, roleNames: string[]) {
  for (const name of roleNames) {
    await removeRoleByName(member, name);
  }
}

export function checkPermission(member: GuildMember,  roleName: string) {
  if (hasRole(member, roleName) || isDev(member)) return
  throw new Error(`You need the ${roleName} role to run this.`);
}

export function isDev(member: GuildMember): boolean {
  return member.id === CONFIG.DEV_ID;
}

export function protectRoles(member: GuildMember, roleNames: string[]): void {
  const foundRole = roleNames.find(name => hasRole(member, name));
  if (!foundRole) return
  throw new Error(`It is not possible to change role of ${foundRole} with this command`);
}

export function ckeckRedundancy(member: GuildMember, roleName: string) {
  if (hasRole(member, roleName)) {
    throw new Error(`${member} is already ${roleName}.`);
  }
}
