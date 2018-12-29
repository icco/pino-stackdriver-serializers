'use strict'

var std_serial = require('pino-std-serializers')

const levels = {
  labels: {
    '10': 'DEBUG',
    '20': 'DEBUG',
    '30': 'INFO',
    '40': 'WARNING',
    '50': 'ERROR',
    '60': 'CRITICAL',
  },
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  }
}

function reqSerializer(req) {
  var connection = req.info || req.connection
  const _req = {
    "requestMethod": req.method,
    "requestUrl": req.url ? (req.url.path || req.url) : "",
    "userAgent": req.headers["user-agent"],
    "remoteIp": connection && connection.remoteAddress,
    "referer": req.headers["referer"],
  }

  _req.headers = req.headers
  _req.id = (typeof req.id === 'function' ? req.id() : (req.id || (req.info ? req.info.id : undefined)))

  return _req
}

function resSerializer (res) {
  const _res = {
    "status": res.statusCode,
  }
  _res.headers = res._headers

  return _res
}


// https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
module.exports = {
  err: std_serial.err,
  mapHttpRequest: function(req) {
    return {
      httpRequest: reqSerializer(req)
    }
  },
  mapHttpResponse: function(res) {
    return {
      httpRequest: resSerializer(res)
    }
  },
  req: reqSerializer,
  res: resSerializer,
  levels,
  Symbol.for('pino.*'): function(rawLog) {
    const _log = rawLog
    _log.severity = rawLog.level
    _log.httpRequest = rawLog.req + rawLog.res

    return _log
  }
}
