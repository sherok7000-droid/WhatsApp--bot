const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['CalculatorBot','Chrome','1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    if (u.connection === 'close') start();
    if (u.connection === 'open') console.log('Bot Connected!');
  });

  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (!text) return;
    try {
      let clean = text.replace(/[^0-9+\-*/().% ]/g, '');
      if (clean.length < 2) return;
      let result = eval(clean);
      if (result!== undefined)
        await sock.sendMessage(msg.key.remoteJid, { text: `*Calculator Bot*\n${text} = ${result}` }, { quoted: msg });
    } catch(e){}
  });

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode("923708755931");
        console.log("PAIRING CODE:", code);
      } catch(e){ console.log(e) }
    }, 4000);
  }
}
start();

