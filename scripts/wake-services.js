const http = require('http');
const https = require('https');

// Define your live Render URLs here as defaults, or let them load from env
const SERVICES = {
  'API Gateway': process.env.API_GATEWAY_URL || 'https://pulseboard-api-gateway.onrender.com',
  'Poller Service': process.env.POLLER_SERVICE_URL || 'https://pulseboard-poller-service.onrender.com',
  'Ingestor Service': process.env.INGESTOR_SERVICE_URL || 'https://pulseboard-ingestor-service.onrender.com',
  'Alert Service': process.env.ALERT_SERVICE_URL || 'https://pulseboard-alert-service.onrender.com'
};

function ping(name, urlString) {
  const url = `${urlString.replace(/\/$/, '')}/health`;
  const client = url.startsWith('https') ? https : http;

  console.log(`[Waking] Sending request to ${name}...`);

  return new Promise((resolve) => {
    const start = Date.now();
    const req = client.get(url, { timeout: 10000 }, (res) => {
      const duration = Date.now() - start;
      if (res.statusCode === 200) {
        console.log(`[Active] ${name} is awake and healthy! (Response: 200 OK, Time: ${duration}ms)`);
      } else {
        console.warn(`[Warning] ${name} responded with status ${res.statusCode} in ${duration}ms`);
      }
      resolve();
    });

    req.on('error', (err) => {
      const duration = Date.now() - start;
      console.error(`[Sleeping/Error] Failed to connect to ${name} after ${duration}ms: ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn(`[Timeout] ${name} request timed out (probably waking up from deep sleep...)`);
      resolve();
    });
  });
}

async function wakeAll() {
  console.log('=========================================');
  console.log('   PULSEBOARD PRODUCTION WARM-UP ENGINE  ');
  console.log('=========================================');
  
  const pings = Object.entries(SERVICES).map(([name, url]) => ping(name, url));
  await Promise.all(pings);
  
  console.log('=========================================');
  console.log(' Warm-up signals dispatched successfully! ');
  console.log('=========================================');
}

wakeAll();
