import { ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction } from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('tapify')
    .setType(ApplicationCommandType.Message),

  async execute(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: false });
    try {
      const targetMessage = interaction.targetMessage;
      if (!targetMessage?.content) {
        return interaction.editReply('Cannot tapify this message (no content).');
      }
      const tapified = this.tapifyText(targetMessage.content);
      return interaction.editReply(`${tapified}`);
    } catch (error) {
      console.error('Error in tapify command:', error);
      return interaction.editReply('Failed to tapify message.');
    }
  },

  tapifyText(text: string): string {
    if (!text) return '';
    
    // Array of muffled sounds
    const muffledSounds = ['mmph', 'mff', 'mph', 'mmm', 'mfff', 'mmmf', 'mphf'];
    
    // Regex for emoji detection (simplified)
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    
    // Split text by spaces to process word by word
    const words = text.split(/(\s+)/);
    
    // Process each word or space
    const tapified = words.map(word => {
      // Preserve spaces
      if (/^\s+$/.test(word)) {
        return word;
      }
      
      // Check if word contains emoji
      if (emojiRegex.test(word)) {
        return word; // Preserve emojis
      }
      
      // Check if word is just punctuation
      if (/^[.,!?;:()\[\]{}'"_-]+$/.test(word)) {
        return word; // Preserve punctuation
      }
      
      // Replace word with muffled sound
      const wordLength = word.length;
      if (wordLength <= 2) {
        return Math.random() > 0.5 ? 'm' : 'mf';
      } else if (wordLength <= 4) {
        return muffledSounds[Math.floor(Math.random() * 3)]; // Pick from first 3
      } else {
        // For longer words, use more complex sounds or repeat
        const sound = muffledSounds[Math.floor(Math.random() * muffledSounds.length)];
        const repeats = Math.max(1, Math.floor(wordLength / 4));
        return sound.repeat(repeats);
      }
    }).join('');
    
    // Add the Loki emojis at beginning and end without random tape sounds
    return `<:loki_cross:1358135008748896326> ${tapified} <:loki_tape:1358135695314780270>`;
  }
};
