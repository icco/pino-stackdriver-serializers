"use strict";

var std_serial = require("pino-std-serializers");

const levels = {
  labels: {
    10: "DEBUG",
    20: "DEBUG",
    30: "INFO",
    40: "WARNING",
    50: "ERROR",
    60: "CRITICAL",
    "10": "DEBUG",
    "20": "DEBUG",
    "30": "INFO",
    "40": "WARNING",
    "50": "ERROR",
    "60": "CRITICAL"
  },
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  }
};

function reqSerializer(req) {
  const _req = {
    requestMethod: req.method,
    requestUrl: `http://${req.headers["host"]}${req.url}`,
    userAgent: req.headers["user-agent"],
    remoteIp: req.remoteAddress,
    referer: req.headers["referer"]
  };

  return _req;
}

function resSerializer(res) {
  const _res = {
    status: res.statusCode.toString(),
    responseSize: res.headers && res.headers["content-length"]
  };

  return _res;
}

// https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
function sdPrettifier(options) {
  return function prettifier(inputData) {
    let logObject;
    if (typeof inputData === "string") {
      const parsedData = JSON.parse(inputData);
      logObject = isPinoLog(parsedData) ? parsedData : undefined;
    } else if (isObject(inputData) && isPinoLog(inputData)) {
      logObject = inputData;
    }

    if (!logObject) return inputData;

    logObject.severity = levels.labels[logObject.level];
    delete logObject.level;

    logObject.timestamp = logObject.time;
    delete logObject.time;

    let httpRequest;
    if (logObject.req && logObject.res) {
      httpRequest = Object.assign(
        reqSerializer(logObject.req),
        resSerializer(logObject.res)
      );
      httpRequest.latency = `${logObject.responseTime / 1e3}s`;
      logObject.context = {
        data: {
          httpRequest
        }
      };
      delete logObject.res;
      delete logObject.req;
    }

    logObject.message = logObject.msg;
    delete logObject.msg;

    return JSON.stringify(logObject) + "\n";
  };

  function isObject(input) {
    return Object.prototype.toString.apply(input) === "[object Object]";
  }

  function isPinoLog(log) {
    return log && (log.hasOwnProperty("v") && log.v === 1);
  }
}

const exp = {
  err: std_serial.err,
  mapHttpRequest: std_serial.mapHttpRequest,
  mapHttpResponse: std_serial.mapHttpResponse,
  req: std_serial.req,
  res: std_serial.res,
  levels,
  sdPrettifier
};

module.exports = exp;
