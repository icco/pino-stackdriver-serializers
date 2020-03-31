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
    "60": "CRITICAL",
  },
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  },
};

function reqSerializer(req) {
  if (req) {
    return {
      requestMethod: req.method,
      requestUrl: req.url,
      userAgent: req.headers["user-agent"],
      remoteIp: req.remoteAddress,
      referer: req.headers["referer"],
    };
  }
  return {};
}

function resSerializer(res) {
  if (res) {
    return {
      status: res.statusCode.toString(),
      responseSize: res.headers && res.headers["content-length"],
    };
  }

  return {};
}

function sdFormatter() {
  return {
    level(label, number) {
      return { severity: levels.labels[number] };
    },
    bindings(bindings) {
      return {};
    },
    log(object) {
      let ret = {};

      if (object.time) {
        ret.timestamp = new Date(object.time).toISOString();
      } else {
        ret.timestamp = new Date(Date.now()).toISOString();
      }

      if (object.res && object.res.req) {
        let httpRequest = {
          requestMethod: object.res.req.method,
          requestUrl: object.res.req.url,
          userAgent: object.res.req.headers["user-agent"],
          remoteIp: object.res.req.remoteAddress,
          referer: object.res.req.headers["referer"],
          status: object.res.statusCode.toString(),
          responseSize: object.res.headers && object.res.headers["content-length"],
        }

        if (object.responseTime) {
          httpRequest.latency = `${object.responseTime / 1e3}s`;
        }
        ret.httpRequest = httpRequest;
      }

      ret.req = object.req;
      ret.res = object.res;
      ret.message = object.msg;

      return ret;
    },
  };
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

    let now = new Date(logObject.time);
    logObject.timestamp = now.toISOString();
    delete logObject.time;

    let httpRequest;
    if (logObject.req && logObject.res) {
      httpRequest = Object.assign(
        reqSerializer(logObject.req),
        resSerializer(logObject.res)
      );
      httpRequest.latency = `${logObject.responseTime / 1e3}s`;
      logObject.httpRequest = httpRequest;
      delete logObject.res;
      delete logObject.req;
      delete logObject.responseTime;
    }

    logObject.message = logObject.msg;
    delete logObject.msg;
    delete logObject.v;

    return JSON.stringify(logObject) + "\n";
  };

  function isObject(input) {
    return Object.prototype.toString.apply(input) === "[object Object]";
  }

  function isPinoLog(log) {
    return log && log.hasOwnProperty("v") && log.v === 1;
  }
}

const exp = {
  err: std_serial.err,
  mapHttpRequest: std_serial.mapHttpRequest,
  mapHttpResponse: std_serial.mapHttpResponse,
  req: std_serial.req,
  res: std_serial.res,
  levels,
  sdPrettifier,
  sdFormatter,
};

module.exports = exp;
