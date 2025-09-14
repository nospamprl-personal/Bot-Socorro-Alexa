const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- CAMBIO 1: Centralizar todas las listas de contactos ---
// Ahora tenemos un objeto principal. La clave ('josefina', 'jorge') será el parámetro en la URL.
const allContacts = {
  josefina: [ // Tus contactos originales
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
  ],
  jorge: [ // Agrega aquí los contactos de tu jorge    
    {
      phone: '5215528862222',
      apikey: '8560106',
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JORGE.'
    },
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
      phone: '5215554134320', // Reemplazar
      apikey: '1711625',           // Reemplazar
      message: '🚨 SOCORRO 🚨\nSe ha activado una alerta de emergencia de JORGE.' // Reemplazar
    }
  ]
  // Puedes agregar más usuarios aquí si quieres, ej: 'mama': [ ... ]
};

// Necesario para recibir JSON de Alexa
app.use(bodyParser.json());

// --- CAMBIO 2: Función reutilizable para enviar notificaciones ---
// Esta función recibe una lista de contactos y les envía los mensajes.
const sendNotifications = (contactsList = []) => {
  console.log('🚨 Activando envío de mensajes...');
  contactsList.forEach(async (contact) => {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${contact.phone}&text=${encodeURIComponent(contact.message)}&apikey=${contact.apikey}`;
    try {
      const response = await axios.get(url);
      console.log(`✅ Mensaje enviado a ${contact.phone}: ${response.data}`);
    } catch (error) {
      console.error(`❌ Error enviando a ${contact.phone}:`, error.message);
    }
  });
};


// Ruta para verificar si el servidor está activo
app.get('/uptimerobot', (req, res) => {
  res.send('✅ Servidor activo');
});

// Ruta manual para disparar alerta (útil para pruebas)
// Ahora puedes probarla así: /alerta?user=josefina o /alerta?user=jorge
app.all('/alerta', (req, res) => {
  const user = req.query.user || 'josefina'; // 'josefina' es el usuario por defecto
  const contactsToSend = allContacts[user];

  if (contactsToSend) {
    sendNotifications(contactsToSend);
    res.send(`✅ Notificaciones enviadas para el usuario: ${user}`);
  } else {
    res.status(404).send(`❌ Usuario '${user}' no encontrado.`);
  }
});

// --- CAMBIO 3: Ruta que responde a Alexa ahora acepta un parámetro ---
// La ruta ahora es '/:user'. Alexa llamará a '.../josefina' o '.../jorge'
app.post('/:user', async (req, res) => {
  const user = req.params.user;
  const contactsToSend = allContacts[user];

  console.log("Alexa está llamando a:", req.originalUrl);
  console.log(`🗣️ Solicitud recibida desde Alexa para el usuario: ${user}`);

  // Si el usuario no existe en nuestra lista, no hacemos nada.
  if (!contactsToSend) {
    console.error(`❌ Usuario '${user}' no encontrado en la configuración.`);
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: "Hubo un error de configuración. Contacta al desarrollador de la skill." },
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
        outputSpeech: { type: "PlainText", text: "No te preocupes, ya estoy pidiendo ayuda." },
        shouldEndSession: true
      }
    });

    // Envía las notificaciones usando la lista de contactos correcta
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


