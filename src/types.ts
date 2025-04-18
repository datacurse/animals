import {
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
} from 'discord.js';

export interface StunnedInfo {
  roles: string[];
  timer: NodeJS.Timeout;
}

// A command can be either a slash command or a context‑menu command
export type Command =
  | {
      data: SlashCommandBuilder;
      execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    }
  | {
      data: ContextMenuCommandBuilder;
      execute: (interaction: MessageContextMenuCommandInteraction) => Promise<void>;
    };

