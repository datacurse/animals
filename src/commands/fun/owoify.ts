import { ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction } from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('owoify')
    .setType(ApplicationCommandType.Message),

  async execute(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: false });
    try {
      const targetMessage = interaction.targetMessage;
      if (!targetMessage?.content) {
        return interaction.editReply('Cannot owoify this message (no content).');
      }
      const owoified = this.owoifyText(targetMessage.content);
      return interaction.editReply(`${owoified}`);
    } catch (error) {
      console.error('Error in owoify command:', error);
      return interaction.editReply('Failed to owoify message.');
    }
  },

  owoifyText(text: string): string {
    if (!text) return '';
    let owoified = text
      .replace(/r|l/g, 'w')
      .replace(/R|L/g, 'W')
      .replace(/n([aeiou])/g, 'ny$1')
      .replace(/N([aeiou])/g, 'Ny$1')
      .replace(/N([AEIOU])/g, 'NY$1')
      .replace(/ove/g, 'uv')
      .replace(/OVE/g, 'UV')
      .replace(/!+/g, '! uwu ')
      .replace(/\?+/g, '? owo ');
    const emotes = ['^w^', 'UwU', 'OwO', '>w<', ':3', 'xwx', '~w~', '^-^', ':3', '^o^'];
    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    owoified = `${randomEmote} ` + owoified;
    return owoified;
  }
};
