const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Pausa entre mensajes
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Listado de contactos por usuario
const allContacts = {
  josefina: [
    { phone: '5215528862222', apikey: '8560106', message: '🚨 SOCORRO 🚨 Se ha activado una alerta de emergencia de JOSEFINA.' },
    { phone: '5215554134320', apikey: '1711625X', message: '🚨 SOCORRO 🚨 Se ha activado una alerta de emergencia de JOSEFINA.' }
  ],
  jorge: [
    { phone: '5215530479667', apikey: '4944088', message: '🚨 SOCORRO 🚨 Se ha activado una alerta de emergencia de JORGE.' },
    { phone: '5215520958384', apikey: '8160008', message: '🚨 SOCORRO 🚨 Se ha activado una alerta de emergencia de JORGE.' },
    { phone: '5215554313528', apikey: '8824221', message: '🚨 SOCORRO 🚨 Se ha activado una alerta de emergencia de JORGE.' },
    { phone: '5215554134320', apikey: '1711625', message: '🚨 SOCORRO 🚨 Se ha activado una alerta de emergencia de JORGE.' }
  ]
};

// Middleware para JSON
app.use(express.json());

// Función para enviar WhatsApp en secuencia
const sendNotifications = async (contactsList = []) => {
  console.log('🚨 Activando envío de mensajes...');
  for (const contact of contactsList) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${contact.phone}&text=${encodeURIComponent(contact.message)}&apikey=${contact.apikey}`;
    try {
      const response = await axios.get(url);
      console.log(`✅ Mensaje enviado a ${contact.phone}: ${response.data}`);
      await delay(1000);
    } catch (error) {
      console.error(`❌ Error enviando a ${contact.phone}:`, error.message);
    }
  }
};

// Ruta de prueba
app.get('/uptimerobot', (req, res) => {
  res.send('✅ Servidor activo');
});

// Ruta principal: recibe POST vacío o con JSON
app.post('/:user', async (req, res) => {
  const user = req.params.user;
  const contactsToSend = allContacts[user];

  console.log("📢 Llamada recibida a:", req.originalUrl);

  if (!contactsToSend) {
    console.error(`❌ Usuario '${user}' no encontrado.`);
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: "Error: usuario no encontrado." },
        shouldEndSession: true
      }
    });
  }

  // Soporte para POST vacío: valores por defecto
  const requestType = req.body?.request?.type || 'IntentRequest';
  const intentName = req.body?.request?.intent?.name || 'ayuda';

  // Respuesta inmediata a Alexa
  if (requestType === 'LaunchRequest' || (requestType === 'IntentRequest' && intentName === 'ayuda')) {
    res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: `Entendido ${user}, ya estoy pidiendo ayuda.` },
        shouldEndSession: true
      }
    });

    // Envía los mensajes
    sendNotifications(contactsToSend);

  } else {
    res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: "No entendí tu solicitud. Intenta decir: Alexa, pide ayuda." },
        shouldEndSession: true
      }
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor activo en http://localhost:${port}`);
});
