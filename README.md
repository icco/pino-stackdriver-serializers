# @icco/pino-stackdriver-serializers

[![Greenkeeper badge](https://badges.greenkeeper.io/icco/pino-stackdriver-serializers.svg)](https://greenkeeper.io/) [![Build Status](https://travis-ci.com/icco/pino-stackdriver-serializers.svg?branch=master)](https://travis-ci.com/icco/pino-stackdriver-serializers)

Pino messaging formatting for Stackdriver.


# Usage

lib/logger.js
```
const pinoLogger = require("pino");
const pinoStackdriver = require("@icco/pino-stackdriver-serializers");

module.exports = {
  logger: pinoLogger({
    messageKey: "message",
    level: "info",
    formatters: pinoStackdriver.sdFormatter(),
  }),
};
```

server.js
```
import express from "express";
import pinoMiddleware from "pino-http";

import { logger } from "./lib/logger.js";

const server = express();
server.use(pinoMiddleware({logger}));
