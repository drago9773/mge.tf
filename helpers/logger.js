import fs from 'node:fs';

export function logRequestToFile(req, filename) {
    const reqData = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      params: req.params,
      body: req.body,
      ip: req.ip,
      protocol: req.protocol,
      httpVersion: req.httpVersion,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path
  };

  const reqDataStr = JSON.stringify(reqData, null, 2);

  fs.writeFile(filename, reqDataStr, err => {
    if (err) {
      console.log('Error writing to file: ' + filename);
      console.error(err);
    } 
  });
}

export function appendRequestToFile(req, filename) {
    const reqData = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      params: req.params,
      body: req.body,
      ip: req.ip,
      protocol: req.protocol,
      httpVersion: req.httpVersion,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path
  };

  const reqDataStr = JSON.stringify(reqData, null, 2);
  fs.appendFile(filename, reqDataStr, err => {
    console.error(err);
  })
}

