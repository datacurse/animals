import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface StunnedInfo {
  roles: string[];
  timer: NodeJS.Timeout;
}

export interface Command {
  data: Partial<SlashCommandBuilder>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
