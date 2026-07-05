const Plugin = require('./base-plugin');

class AIChat extends Plugin {
    constructor(client, database) {
        super(client, database);
        this.name = 'AI Chat';
        
        this.commands = [
            {
                name: 'ai',
                description: 'Pale ak AI',
                execute: async (message, args) => {
                    if (!args.length) {
                        return '❌ Tape yon mesaj. Egzanp: !ai Sak pase?';
                    }
                    
                    const userMessage = args.join(' ');
                    
                    const responses = {
                        'sak pase': 'N ap boule! Kijan ou ye?',
                        'ki moun ou ye': 'Mwen se InfinityBot AI, yon asistan WhatsApp!',
                        'kijan ou ye': 'Mwen byen, mèsi! E ou menm?'
                    };
                    
                    const reply = responses[userMessage.toLowerCase()] || 
                        `M byen resevwa mesaj ou a: "${userMessage}". M ap aprann plis chak jou!`;
                    
                    return `🤖 **Infinity AI:** ${reply}`;
                }
            }
        ];
    }
}

module.exports = AIChat;
