const Plugin = require('./base-plugin');

class Verification extends Plugin {
    constructor(client, database) {
        super(client, database);
        this.name = 'Verifikasyon ak Notification';
        
        // Baz done senp (nan memwa)
        this.users = new Map();        // nimewo -> {code, verifye, non}
        this.banList = new Map();      // nimewo -> {rezon, date}
        this.notifications = [];       // Lis notification
        
        this.commands = [
            // === ENSKRIPSYON ===
            {
                name: 'enskri',
                description: 'Enskri ak nimewo WhatsApp ou',
                execute: async (msg, args) => {
                    const userId = msg.from; // Nimewo moun lan
                    
                    // Tcheke si deja verifye
                    if (this.users.has(userId) && this.users.get(userId).verifye) {
                        return '✅ Ou deja verifye!';
                    }
                    
                    // Tcheke si nan ban list
                    if (this.banList.has(userId)) {
                        const ban = this.banList.get(userId);
                        return `🚫 Ou banni! Rezon: ${ban.rezon}`;
                    }
                    
                    // Jenere yon kòd 6 chif
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    
                    // Sere enfòmasyon an
                    this.users.set(userId, {
                        code: code,
                        verifye: false,
                        non: args.join(' ') || 'Itilizatè',
                        date: new Date()
                    });
                    
                    // Voye kòd verification an
                    await msg.reply(`🔐 **Verifikasyon**
                    
Yon kòd 6 chif voye nan nimewo ou a.
Tape: !verify [kòd la]

📱 Kòd ou: ||${code}||`);
                    
                    // Voye notification bay admin (toujou)
                    const owners = (process.env.OWNERS || '').split(',');
                    for (const owner of owners) {
                        if (owner) {
                            try {
                                const chat = await msg.client.getChatById(owner + '@c.us');
                                await chat.sendMessage(`📝 **Nouvo enskripsyon**
Nimewo: ${userId}
Non: ${args.join(' ') || 'Anonim'}
Kòd: ${code}`);
                            } catch(e) {}
                        }
                    }
                    
                    return null;
                }
            },
            
            // === VERIFYE KÒD LA ===
            {
                name: 'verify',
                description: 'Verifye kòd ou resevwa a',
                execute: async (msg, args) => {
                    const userId = msg.from;
                    const code = args[0];
                    
                    // Tcheke si gen yon kòd
                    if (!this.users.has(userId)) {
                        return '❌ Ou poko enskri. Tape !enskri premye.';
                    }
                    
                    const user = this.users.get(userId);
                    
                    // Tcheke si deja verifye
                    if (user.verifye) {
                        return '✅ Ou deja verifye!';
                    }
                    
                    // Verifye kòd la
                    if (user.code === code) {
                        user.verifye = true;
                        this.users.set(userId, user);
                        
                        // Notifye admin
                        const owners = (process.env.OWNERS || '').split(',');
                        for (const owner of owners) {
                            if (owner) {
                                try {
                                    const chat = await msg.client.getChatById(owner + '@c.us');
                                    await chat.sendMessage(`✅ **Itilizatè verifye!**
Nimewo: ${userId}
Non: ${user.non}`);
                                } catch(e) {}
                            }
                        }
                        
                        return `✅ **Verifye ak siksè!**
Byenveni ${user.non}! 🎉

Ou kapab kounye a resevwa notifikasyon.`;
                    } else {
                        return '❌ Kòd la pa kòrèk. Tape !enskri pou jwenn yon lòt.';
                    }
                }
            },
            
            // === BANNI YON MOUN ===
            {
                name: 'ban',
                description: 'Banni yon itilizatè (Admin sèlman)',
                execute: async (msg, args) => {
                    // Verifikasyon admin
                    const owners = (process.env.OWNERS || '').split(',');
                    const isOwner = owners.includes(msg.author) || owners.includes(msg.from);
                    if (!isOwner) return '❌ Se admin sèlman ka banni moun.';
                    
                    const nimewo = args[0];
                    const rezon = args.slice(1).join(' ') || 'Pa gen rezon';
                    
                    if (!nimewo) return '❌ Tape nimewo a. Egzanp: !ban 509XXXXXXX spam';
                    
                    // Netwaye nimewo a
                    const cleanNumber = nimewo.replace(/[^0-9]/g, '');
                    
                    // Ajoute nan ban list
                    this.banList.set(cleanNumber, {
                        rezon: rezon,
                        date: new Date(),
                        banniPa: msg.author
                    });
                    
                    // Retire nan users si li te enskri
                    if (this.users.has(cleanNumber + '@c.us')) {
                        this.users.delete(cleanNumber + '@c.us');
                    }
                    if (this.users.has(cleanNumber)) {
                        this.users.delete(cleanNumber);
                    }
                    
                    return `🚫 ${cleanNumber} banni!
Rezon: ${rezon}`;
                }
            },
            
            // === DEBANNI ===
            {
                name: 'deban',
                description: 'Debanni yon itilizatè (Admin)',
                execute: async (msg, args) => {
                    const owners = (process.env.OWNERS || '').split(',');
                    const isOwner = owners.includes(msg.author) || owners.includes(msg.from);
                    if (!isOwner) return '❌ Se admin sèlman.';
                    
                    const nimewo = args[0];
                    if (!nimewo) return '❌ Tape nimewo a.';
                    
                    const cleanNumber = nimewo.replace(/[^0-9]/g, '');
                    
                    if (this.banList.has(cleanNumber)) {
                        this.banList.delete(cleanNumber);
                        return `✅ ${cleanNumber} debanni!`;
                    }
                    return `❌ ${cleanNumber} pa nan ban list.`;
                }
            },
            
            // === GADE BAN LIST ===
            {
                name: 'banlist',
                description: 'Gade tout moun banni yo (Admin)',
                execute: async (msg, args) => {
                    const owners = (process.env.OWNERS || '').split(',');
                    const isOwner = owners.includes(msg.author) || owners.includes(msg.from);
                    if (!isOwner) return '❌ Se admin sèlman.';
                    
                    if (this.banList.size === 0) {
                        return '✅ Pa gen moun banni.';
                    }
                    
                    let liste = '🚫 **Ban List**\n\n';
                    this.banList.forEach((value, key) => {
                        liste += `📵 ${key} - ${value.rezon}\n`;
                    });
                    
                    return liste;
                }
            },
            
            // === VOYE NOTIFIKASYON ===
            {
                name: 'notify',
                description: 'Voye yon notification bay tout itilizatè verifye (Admin)',
                execute: async (msg, args) => {
                    const owners = (process.env.OWNERS || '').split(',');
                    const isOwner = owners.includes(msg.author) || owners.includes(msg.from);
                    if (!isOwner) return '❌ Se admin sèlman.';
                    
                    if (!args.length) return '❌ Tape mesaj la. Egzanp: !notify Bonjou tout moun!';
                    
                    const mesaj = args.join(' ');
                    let voye = 0;
                    let bloke = 0;
                    
                    // Voye bay tout itilizatè verifye yo
                    this.users.forEach(async (user, userId) => {
                        if (user.verifye) {
                            // Tcheke si banni
                            const cleanId = userId.replace('@c.us', '');
                            if (this.banList.has(cleanId)) {
                                bloke++;
                                return;
                            }
                            
                            try {
                                const chat = await msg.client.getChatById(userId);
                                await chat.sendMessage(`📢 **Notifikasyon InfinityBot**\n\n${mesaj}`);
                                voye++;
                            } catch(e) {
                                bloke++;
                            }
                        }
                    });
                    
                    return `📢 **Notifikasyon voye!**
✅ Voye: ${voye}
❌ Bloke: ${bloke}`;
                }
            },
            
            // === STATISTIK ===
            {
                name: 'stats',
                description: 'Estatistik sistèm nan',
                execute: async (msg, args) => {
                    let verifye = 0;
                    let anVerifye = 0;
                    
                    this.users.forEach(user => {
                        if (user.verifye) verifye++;
                        else anVerifye++;
                    });
                    
                    return `📊 **Estatistik**

👥 Total enskri: ${this.users.size}
✅ Verifye: ${verifye}
⏳ Ap tann: ${anVerifye}
🚫 Banni: ${this.banList.size}`;
                }
            }
        ];
    }
    
    // === AUTO-REPLY POU MOUN BANNI ===
    async autoReply(message) {
        const userId = message.from;
        const cleanId = userId.replace('@c.us', '');
        
        if (this.banList.has(cleanId)) {
            const ban = this.banList.get(cleanId);
            await message.reply(`🚫 Ou banni nan sistèm nan.
📋 Rezon: ${ban.rezon}
📅 Dat: ${ban.date.toLocaleDateString()}
❌ Ou pa ka resevwa notifikasyon.`);
            return true; // Bloke mesaj la
        }
        
        return false;
    }
}

module.exports = Verification;
