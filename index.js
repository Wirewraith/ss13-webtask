'use latest';

const Bluebird = require('bluebird');
const Http2byond = require('http2byond');
const qs = require('qs');

const config = {
  limit: 10, //How many servers should we query?
  cooldown: 60 //Period in seconds between possible game server pings (so we don't spam peeps)
};

module.exports = function(context, cb) {
  function error(message) {
    cb(null, {error: message});
  }
  
  function getStorage() {
    return new Bluebird((resolve, reject) => {
      context.storage.get((err, data) => {
        if (err) {
          return reject(err);
        }
        
        resolve(data || {});
      });
    });
  }
  
  const byondLinkRegex = /^byond:\/\/(.*):([\d]+)$/im;
  function parseByondUrl(url) {
    return url.match(byondLinkRegex);
  }
  
  function getByondInfo(url, port) {
    return new Bluebird((resolve, reject) => {
      const storedServerData = dataStorage[`${url}:${port}`] || false;
      const now = Date.now();

      //If server data isn't stored, or we're outside the cooldown duration
      if (!storedServerData || now - storedServerData.last > config.cooldown * 1000) {
        Http2byond({
          ip: url,
          port: port,
          topic: '?status'
        }, (body, err) => {
          if (err) {
            return reject(err);
          }
          
          body = qs.parse(body);
          
          //Insert/update item in storage
          dataStorage[`${url}:${port}`] = {
            last: now,
            status: body
          };
          
          resolve(body);
        });
      
      } else {
        //Return data from storage
        resolve(storedServerData.status);
      }
    });
  }

  const serverParam = context.data.server;
  let servers = [];
  
  if (typeof serverParam === 'string') {
    servers.push(serverParam);
  } else if (Array.isArray(serverParam)) {
    servers = serverParam;
    
    if (servers.length > config.limit) {
      return error(`You sent too many server links! The limit is ${config.limit}.`);
    }
    
  } else {
    //We got something weird!! (or nothing at all)
    return error('Invalid server parameter given. Please provide an array or a string.');
  }
  
  const response = [];
  let dataStorage;

  //Loop through all the servers grabbing data where appropriate
  getStorage().then((data) => {
    dataStorage = data;
    
  }).then(function loop(i) {
    if (i < servers.length) {
      let workPromise;
      const server = servers[i];
      const parts = parseByondUrl(server);
      
      //Valid Byond URL
      if (parts && Array.isArray(parts) && parts.length > 2) {
        workPromise = getByondInfo(parts[1], parts[2]);
        workPromise.then((body) => {
          console.log(body);
          response.push({
            url: server,
            status: body
          });
        }).catch(() => {
          //This is here to avoid an "uncaught exception" error. In fact, exceptions are handled by the catch() block in the overarching promise chain
        });
        
      } else {
        response.push({
          url: server,
          error: 'Invalid Byond URL given.'
        });
        
        workPromise = new Bluebird.resolve(0);
      }
      
      return workPromise.return(i + 1).then(loop);
    }
    
  }).then(() => {
    //All done!
    
    //Persist storage
    context.storage.set(dataStorage);
    
    cb(null, {servers: response});
    
  }).catch((e) => {
    //:sadtrombone:
    error(e);
  });
};
