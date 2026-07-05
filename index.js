require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'infinitybot' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Eskane QR kod la ak telefòn ou');
});

client.on('ready', () => {
    console.log(chalk.green('InfinityBot AI pare!'));
});

client.on('message', async (message) => {
    const body = message.body.toLowerCase();
    
    if (body === '!ping') {
        await message.reply('🏓 Pong!');
    } else if (body === '!bonjou') {
        await message.reply('👋 Bonjou! Mwen se InfinityBot AI. Tape !ede pou èd.');
    } else if (body === '!ede') {
        await message.reply(`🤖 **InfinityBot AI - Kòmand yo**
        
!ping - Tcheke si bot la ap mache
!bonjou - Salitasyon
!ede - Lis kòmand
!stiker - Kreye stiker (reponn yon imaj)
!ai [mesaj] - Pale ak AI
!translate [tèks] - Tradiksyon
!meteo [vil] - Tanperati
!nouvèl - Dènye nouvèl`);
    } else if (body.startsWith('!ai ')) {
        const question = body.slice(4);
        await message.reply(`🤖 **Infinity AI:** M ap reponn: "${question}" ... (Fonksyonalite AI ap vini)`);
    } else {
        // Auto reply senp
        if (body.includes('bonjou') || body.includes('bonswa')) {
            await message.reply('👋 Bonjou! Tape !ede pou wè sa mwen kapab fè.');
        }
    }
});

client.initialize();
console.log(chalk.cyan('InfinityBot AI ap demare...'));
