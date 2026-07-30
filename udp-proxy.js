/**
 * UDP proxy: forwards SIP (5060) and RTP (10000-10100) from Windows to WSL2/Asterisk
 * Usage: node udp-proxy.js <wsl2-ip>
 */
const dgram = require('dgram');
const net = require('net');

const WSL2_IP = process.argv[2] || '10.186.128.28';

function createUdpProxy(listenPort, targetIp, targetPort) {
  const server = dgram.createSocket('udp4');
  const clientMap = new Map(); // sourceAddr -> {socket, lastSeen}

  server.on('message', (msg, rinfo) => {
    const key = `${rinfo.address}:${rinfo.port}`;

    if (!clientMap.has(key)) {
      // Create a new socket for this client to talk to Asterisk
      const client = dgram.createSocket('udp4');
      client.bind(() => {
        clientMap.set(key, { socket: client, address: rinfo.address, port: rinfo.port });

        client.on('message', (reply) => {
          // Forward Asterisk reply back to original client
          server.send(reply, rinfo.port, rinfo.address);
        });

        client.on('error', () => client.close());
      });

      // Clean up old sockets after 5 minutes
      setTimeout(() => {
        if (clientMap.has(key)) {
          const entry = clientMap.get(key);
          entry.socket.close();
          clientMap.delete(key);
        }
      }, 5 * 60 * 1000);
    }

    const entry = clientMap.get(key);
    if (entry) {
      entry.socket.send(msg, targetPort, targetIp);
    }
  });

  server.on('error', (err) => {
    console.error(`UDP proxy error on port ${listenPort}:`, err.message);
  });

  server.bind(listenPort, '0.0.0.0', () => {
    console.log(`UDP proxy: 0.0.0.0:${listenPort} -> ${targetIp}:${targetPort}`);
  });

  return server;
}

console.log(`Starting UDP proxies -> WSL2 at ${WSL2_IP}`);

// SIP port
createUdpProxy(5060, WSL2_IP, 5060);

// RTP ports
for (let port = 10000; port <= 10100; port++) {
  createUdpProxy(port, WSL2_IP, port);
}

console.log('All UDP proxies started. Press Ctrl+C to stop.');
