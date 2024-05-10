
const express = require('express');
const httpProxy = require('http-proxy');

const app = express();

const BASE_PATH = '';

const proxy = httpProxy.createProxy();
app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split('.')[0];
  const resolvesTo = `${BASE_PATH}/${subdomain}`;

  return proxy.web(req, res, { target : resolvesTo , changeOrigin : true });
});

proxy.on('proxyReq', ( proxyReq, req, res) => {
  const url = req.url;
  if(url === '/') proxyReq.path += 'index.html';
})

app.listen(8000, () => { console.log('Reverse proxy running..: 8000')});