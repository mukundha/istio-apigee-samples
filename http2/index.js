const http2 = require('http2');
const server = http2.createServer()
server.on('error', (err) => console.error(err));
server.on('stream', (stream, headers) => {
  // stream is a Duplex
  stream.respond({
    'content-type': 'text/plain',
    ':status': 200
  });
  stream.end('Hello world!');
});
server.listen(8080);

