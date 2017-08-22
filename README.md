Hello! This is a little thing to query the status of Space Station 13 (https://spacestation13.com/) servers hosted via the Byond (http://www.byond.com/) platform. It can accept multiple server URLs but will cache responses for a short duration to avoid spamming server hosts.

### Usage:

Single server:
```
<webtask URL>?server=byond://some.ss13.server:4321
```

Multiple servers:
```
<webtask URL>?server[0]=byond://some.ss13.server:4321&server[1]=byond://some.ss13.server:4322
```

### Example response:
```json
{
  "servers": [
    {
      "url": "byond://some.ss13.server:4321",
      "status": {
        "mode": "secret",
        "players": "27",
        "elapsed": "1190",
        ...
      }
    },
    ...
  ]
}
```

### Notes

- All server URLs must be given in the correct format (byond:// prefix, port suffix).
- Cached results will be returned on further queries for 60 seconds after an initial query.
- There is a max limit of 10 server URLs.

### Acknowledgements

- [This real handy byond querying package](https://github.com/tigercat2000/http2byond)
