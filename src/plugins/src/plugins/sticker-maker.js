const Plugin = require('./base-plugin');

class StickerMaker extends Plugin {
    constructor(client, database) {
        super(client, database);
        this.name = 'Sticker Maker';
        
        this.commands = [
            {
                name: 'stiker',
                description: 'Kreye yon stiker',
                execute: async (message, args) => {
                    if (!message.hasMedia) {
                        return '❌ Reponn yon imaj ak !stiker';
                    }
                    
                    const media = await message.downloadMedia();
                    await message.reply(media, message.from, {
                        sendMediaAsSticker: true,
                        stickerAuthor: 'InfinityBot',
                        stickerName: '✨'
                    });
                    
                    return null;
                }
            }
        ];
    }
}

module.exports = StickerMaker;
