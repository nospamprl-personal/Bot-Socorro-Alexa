const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Objeto centralizado con las listas de contactos
const allContacts = {
  josefina: [
    {
      phone: '5215528862222',
      apikey: '8560106',
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JOSEFINA.'
    },
    {
      phone: '5215554134320',
      apikey: '1711625X',
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JOSEFINA.'
    }
  ],
  jorge: [
    {
      phone: '5215530479667',
      apikey: '4944088',
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JORGE.'
    },
    {
      phone: '5215520958384',
      apikey: '8160008',
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JORGE.'
    },
    {
      phone: '5215554313528',
      apikey: '8824221',
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JORGE.'
    },
    {
      phone: '5215554134320',
      apikey: '1711625',
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JORGE.'
    }
  ]
};

// Middleware para recibir JSON de Alexa
app.use(express.json());

// --- CAMBIO CLAVE: Función de notificaciones corregida ---
// Se reemplaza forEach por un bucle for...of que funciona correctamente con await.
const sendNotifications = async (contactsList = []) => {
  console.log('🚨 Activando envío de mensajes en secuencia...');
  for (const contact of contactsList) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${contact.phone}&text=${encodeURIComponent(contact.message)}&apikey=${contact.apikey}`;
    try {
      // await ahora pausará el bucle hasta que esta petición termine.
      const response = await axios.get(url);
      console.log(`✅ Mensaje enviado a ${contact.phone}: ${response.data}`);
      await delay(1000); // Pequeña pausa opcional entre mensajes para no saturar
    } catch (error) {
      console.error(`❌ Error enviando a ${contact.phone}:`, error.message);
    }
  }
};

// Ruta para verificar si el servidor está activo
app.get('/uptimerobot', (req, res) => {
  res.send('✅ Servidor activo');
});


// --- RUTA UNIFICADA Y CORREGIDA ---
// Esta ruta es la ÚNICA que maneja '/:user'
// Está diseñada para recibir el POST de Alexa.
app.post('/:user', async (req, res) => {
  // Se lee el usuario correctamente desde los parámetros de la ruta.
  const user = req.params.user;
  const contactsToSend = allContacts[user];

  console.log("Alexa está llamando a:", req.originalUrl);
  console.log(`🗣️ Solicitud recibida desde Alexa para el usuario: ${user}`);

  // Si el usuario no existe en nuestra lista, respondemos con error.
  if (!contactsToSend) {
    console.error(`❌ Usuario '${user}' no encontrado en la configuración.`);
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: "Hubo un error de configuración. El usuario no fue encontrado." },
        shouldEndSession: true
      }
    });
  }

  const requestType = req.body?.request?.type;
  const intentName = req.body?.request?.intent?.name;

  if (requestType === 'LaunchRequest' || (requestType === 'IntentRequest' && intentName === 'ayuda')) {
    // Responde inmediatamente a Alexa para evitar timeout
    res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: `Entendido ${user}, no te preocupes, ya estoy pidiendo ayuda.` },
        shouldEndSession: true
      }
    });

    // Envía las notificaciones usando la lista de contactos correcta
    // Esta función ahora se ejecutará de forma predecible y en orden.
    sendNotifications(contactsToSend);

  } else {
    // Intent no reconocido
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



