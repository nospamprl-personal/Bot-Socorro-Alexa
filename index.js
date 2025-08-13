const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Lista de contactos a notificar
const contacts = [
  {
    phone: '5215528862222',
    apikey: '8560106',
    message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JOSEFINA.'
  },
  {
    phone: '5215554134320',
    apikey: '1711625',
    message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JOSEFINA.'
  }
];

// Necesario para recibir JSON de Alexa
app.use(bodyParser.json());

// Ruta para verificar si el servidor está activo
app.get('/uptimerobot', (req, res) => {
  res.send('✅ Servidor activo');
});

// Ruta manual para disparar alerta (útil para pruebas)
app.get('/alerta', async (req, res) => {
  console.log('🚨 Emergencia activada. Enviando mensajes...');
  for (const contact of contacts) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${contact.phone}&text=${encodeURIComponent(contact.message)}&apikey=${contact.apikey}`;
    try {
      const response = await axios.get(url);
      console.log(`✅ Mensaje enviado a ${contact.phone}: ${response.data}`);
    } catch (error) {
      console.error(`❌ Error enviando a ${contact.phone}:`, error.message);
    }
    await delay(1); // dummy: Espera 1 ms, ajusta si quieres
  }
  res.send('✅ Notificaciones enviadas');
});

// Ruta que responde al llamado desde Alexa
app.post('/', async (req, res) => {
  const requestType = req.body?.request?.type;
  const intentName = req.body?.request?.intent?.name;

  console.log('🗣️ Solicitud recibida desde Alexa:', JSON.stringify(req.body));

  if (requestType === 'LaunchRequest' || (requestType === 'IntentRequest' && intentName === 'ayuda')) {
    console.log('🆘 Activando mensajes de emergencia...');

    // Responde ya a Alexa para evitar timeout
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No te preocupes, ya estoy pidiendo ayuda."
        },
        card: {
          type: "Simple",
          title: "Emergencia activada",
          content: "Se han enviado mensajes de ayuda."
        },
        shouldEndSession: true
      }
    });

    // Enviar mensajes en paralelo sin bloquear la respuesta a Alexa
    contacts.forEach(async (contact) => {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${contact.phone}&text=${encodeURIComponent(contact.message)}&apikey=${contact.apikey}`;
      try {
        const response = await axios.get(url);
        console.log(`✅ Mensaje enviado a ${contact.phone}: ${response.data}`);
      } catch (error) {
        console.error(`❌ Error enviando a ${contact.phone}:`, error.message);
      }
    });

    return;
  }

  // Intent no reconocido
  return res.json({
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: "No entendí tu solicitud. Intenta decir: Alexa, pide ayuda."
      },
      shouldEndSession: true
    }
  });
});

// **Esta es la línea que faltaba para iniciar el servidor en el puerto correcto**
app.listen(port, () => {
  console.log(`🚀 Servidor activo en http://localhost:${port}`);
});
