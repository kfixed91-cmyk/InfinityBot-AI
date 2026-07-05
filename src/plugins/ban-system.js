const Plugin = require('./base-plugin');
const fs = require('fs');
const path = require('path');

class BanSystem extends Plugin {
    constructor(client, database) {
        super(client, database);
        this.name = 'Sistèm Ban';
        
        // Fichye pou sere ban list yo (pou pa pèdi yo lè bot la restart)
        this.banFile = path.join(__dirname, '..', '..', 'ban-list.json');
        this.loadBanList(); // Chaje lis la si fichye a egziste
        
        this.commands = [
            // === AJOUTE YON NIMEWO NAN BAN LIST ===
            {
                name: 'ban-nimewo',
                description: 'Ajoute yon nimewo nan ban list',
                execute: async (msg, args) => {
                    // Verifikasyon admin
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    const nimewo = args[0];
                    const rezon = args.slice(1).join(' ') || 'Pa gen rezon';
                    
                    if (!nimewo) {
                        return '❌ Tape nimewo a.\nEgzanp: !ban-nimewo 509XXXXXXX Spam';
                    }
                    
                    // Netwaye nimewo a (kenbe chif sèlman)
                    const cleanNumber = nimewo.replace(/[^0-9]/g, '');
                    
                    if (cleanNumber.length < 8) {
                        return '❌ Nimewo a pa valid. Mete yon nimewo konplè.';
                    }
                    
                    // Ajoute nan ban list
                    this.banList[cleanNumber] = {
                        rezon: rezon,
                        date: new Date().toISOString(),
                        banniPa: msg.author || msg.from,
                        non: args.slice(1).join(' ') || 'Enkoni'
                    };
                    
                    // Sove nan fichye
                    this.saveBanList();
                    
                    return `🚫 **Nimewo banni!**
📵 ${cleanNumber}
📋 Rezon: ${rezon}
👮 Banni pa: ${msg.author || 'Admin'}`;
                }
            },
            
            // === RETIRE YON NIMEWO NAN BAN LIST ===
            {
                name: 'deban-nimewo',
                description: 'Retire yon nimewo nan ban list',
                execute: async (msg, args) => {
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    const nimewo = args[0];
                    if (!nimewo) return '❌ Tape nimewo a.';
                    
                    const cleanNumber = nimewo.replace(/[^0-9]/g, '');
                    
                    if (this.banList[cleanNumber]) {
                        delete this.banList[cleanNumber];
                        this.saveBanList();
                        return `✅ ${cleanNumber} retire nan ban list!`;
                    }
                    
                    return `❌ ${cleanNumber} pa nan ban list.`;
                }
            },
            
            // === GADE TOUT NIMEWO BANNI YO ===
            {
                name: 'lis-banni',
                description: 'Gade tout nimewo banni yo',
                execute: async (msg, args) => {
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    const nimewoList = Object.keys(this.banList);
                    
                    if (nimewoList.length === 0) {
                        return '✅ Pa gen nimewo banni.';
                    }
                    
                    let repons = `🚫 **Lis Nimewo Banni** (${nimewoList.length} total)\n\n`;
                    
                    nimewoList.forEach((nimewo, index) => {
                        const info = this.banList[nimewo];
                        repons += `${index + 1}. 📵 ${nimewo}\n`;
                        repons += `   📋 ${info.rezon}\n`;
                        repons += `   📅 ${new Date(info.date).toLocaleDateString()}\n\n`;
                    });
                    
                    return repons;
                }
            },
            
            // === BAN PAKÈ (Plizyè nimewo an menm tan) ===
            {
                name: 'ban-pake',
                description: 'Banni plizyè nimewo an menm tan',
                execute: async (msg, args) => {
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    // Separe nimewo yo ak vigil
                    const rezonIndex = args.findIndex(a => a.startsWith('-'));
                    const rezon = rezonIndex !== -1 ? args.slice(rezonIndex + 1).join(' ') : 'Spam';
                    const nimewoList = rezonIndex !== -1 ? args.slice(0, rezonIndex) : args;
                    
                    if (nimewoList.length === 0) {
                        return '❌ Tape nimewo yo.\nEgzanp: !ban-pake 509XXX 509YYY - Rezon';
                    }
                    
                    let banni = 0;
                    let erè = 0;
                    
                    nimewoList.forEach(nimewo => {
                        const cleanNumber = nimewo.replace(/[^0-9]/g, '');
                        if (cleanNumber.length >= 8) {
                            this.banList[cleanNumber] = {
                                rezon: rezon || 'Pakè',
                                date: new Date().toISOString(),
                                banniPa: msg.author || msg.from
                            };
                            banni++;
                        } else {
                            erè++;
                        }
                    });
                    
                    this.saveBanList();
                    
                    return `🚫 **Ban Pakè finalize!**
✅ Banni: ${banni}
❌ Erè: ${erè}
📋 Rezon: ${rezon}`;
                }
            },
            
            // === RECHERCHE YON NIMEWO ===
            {
                name: 'rechèch',
                description: 'Chèche si yon nimewo nan ban list',
                execute: async (msg, args) => {
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    const nimewo = args.join(' ');
                    if (!nimewo) return '❌ Tape nimewo a.';
                    
                    const cleanNumber = nimewo.replace(/[^0-9]/g, '');
                    
                    // Chèche nan tout nimewo yo
                    let resultat = [];
                    Object.keys(this.banList).forEach(num => {
                        if (num.includes(cleanNumber)) {
                            resultat.push(`${num} - ${this.banList[num].rezon}`);
                        }
                    });
                    
                    if (resultat.length === 0) {
                        return `✅ ${cleanNumber} pa nan ban list.`;
                    }
                    
                    return `🔍 **Rezilta rechèch:**\n\n${resultat.join('\n')}`;
                }
            },
            
            // === EKSPORTE BAN LIST ===
            {
                name: 'ekspòte-ban',
                description: 'Ekspòte ban list la nan yon fichye',
                execute: async (msg, args) => {
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    const exportPath = path.join(__dirname, '..', '..', 'ban-ekspòte.json');
                    fs.writeFileSync(exportPath, JSON.stringify(this.banList, null, 2));
                    
                    return `📁 Ban list ekspòte nan fichye a!\n📊 ${Object.keys(this.banList).length} nimewo`;
                }
            },
            
            // === IMPORTE BAN LIST ===
            {
                name: 'enpòte-ban',
                description: 'Enpòte yon ban list sot nan yon fichye',
                execute: async (msg, args) => {
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    try {
                        const importPath = path.join(__dirname, '..', '..', 'ban-ekspòte.json');
                        if (fs.existsSync(importPath)) {
                            const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));
                            Object.keys(data).forEach(key => {
                                this.banList[key] = data[key];
                            });
                            this.saveBanList();
                            return `✅ ${Object.keys(data).length} nimewo enpòte!`;
                        }
                        return '❌ Fichye ban-ekspòte.json pa jwenn.';
                    } catch(e) {
                        return '❌ Erè pandan enpòtasyon.';
                    }
                }
            },
            
            // === EFEASE TOUT BAN LIST ===
            {
                name: 'vide-ban',
                description: 'Efase tout ban list (Admin sèlman)',
                execute: async (msg, args) => {
                    if (!this.isOwner(msg)) return '❌ Se admin sèlman.';
                    
                    const total = Object.keys(this.banList).length;
                    this.banList = {};
                    this.saveBanList();
                    
                    return `🗑️ ${total} nimewo efase nan ban list!`;
                }
            }
        ];
    }
    
    // === TCHEKE SI YON MOUN BANNI ===
    isBanned(userId) {
        const cleanId = userId.replace('@c.us', '').replace('@g.us', '');
        
        // Tcheke dirèkteman
        if (this.banList[cleanId]) return true;
        
        // Tcheke si nimewo a nan ban list
        const nimewo = cleanId.replace(/[^0-9]/g, '');
        if (this.banList[nimewo]) return true;
        
        return false;
    }
    
    // === VERIFIKASYON ADMIN ===
    isOwner(msg) {
        const owners = (process.env.OWNERS || '').split(',');
        return owners.includes(msg.author) || owners.includes(msg.from);
    }
    
    // === SOVE BAN LIST NAN FICHYE ===
    saveBanList() {
        try {
            fs.writeFileSync(this.banFile, JSON.stringify(this.banList, null, 2));
            console.log(`✅ Ban list sove! ${Object.keys(this.banList).length} nimewo`);
        } catch(e) {
            console.error('Erè pandan sove ban list:', e.message);
        }
    }
    
    // === CHAJE BAN LIST SOT NAN FICHYE ===
    loadBanList() {
        try {
            if (fs.existsSync(this.banFile)) {
                const data = fs.readFileSync(this.banFile, 'utf8');
                this.banList = JSON.parse(data);
                console.log(`✅ Ban list chaje! ${Object.keys(this.banList).length} nimewo`);
            } else {
                this.banList = {};
                console.log('📁 Nouvo ban list kreye!');
            }
        } catch(e) {
            this.banList = {};
            console.error('Erè pandan chajman ban list:', e.message);
        }
    }
    
    // === AUTO-REPLY POU BLOKE MOUN BANNI YO ===
    async autoReply(message) {
        if (this.isBanned(message.from)) {
            const cleanId = message.from.replace('@c.us', '');
            const banInfo = this.banList[cleanId];
            
            if (banInfo) {
                await message.reply(`🚫 **Ou banni nan sistèm nan!**
📋 Rezon: ${banInfo.rezon}
📅 Dat: ${new Date(banInfo.date).toLocaleDateString()}
❌ Ou pa ka itilize bot la.`);
            } else {
                await message.reply('🚫 Ou banni! Kontakte admin pou deban.');
            }
            
            return true; // Bloke tout aksyon
        }
        return false;
    }
}

module.exports = BanSystem;
