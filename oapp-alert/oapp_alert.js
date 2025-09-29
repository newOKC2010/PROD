// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = import.meta.require;

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS((exports) => {
  exports.parse = function(source, transform) {
    return new ArrayParser(source, transform).parse();
  };

  class ArrayParser {
    constructor(source, transform) {
      this.source = source;
      this.transform = transform || identity;
      this.position = 0;
      this.entries = [];
      this.recorded = [];
      this.dimension = 0;
    }
    isEof() {
      return this.position >= this.source.length;
    }
    nextCharacter() {
      var character = this.source[this.position++];
      if (character === "\\") {
        return {
          value: this.source[this.position++],
          escaped: true
        };
      }
      return {
        value: character,
        escaped: false
      };
    }
    record(character) {
      this.recorded.push(character);
    }
    newEntry(includeEmpty) {
      var entry;
      if (this.recorded.length > 0 || includeEmpty) {
        entry = this.recorded.join("");
        if (entry === "NULL" && !includeEmpty) {
          entry = null;
        }
        if (entry !== null)
          entry = this.transform(entry);
        this.entries.push(entry);
        this.recorded = [];
      }
    }
    consumeDimensions() {
      if (this.source[0] === "[") {
        while (!this.isEof()) {
          var char = this.nextCharacter();
          if (char.value === "=")
            break;
        }
      }
    }
    parse(nested) {
      var character, parser, quote;
      this.consumeDimensions();
      while (!this.isEof()) {
        character = this.nextCharacter();
        if (character.value === "{" && !quote) {
          this.dimension++;
          if (this.dimension > 1) {
            parser = new ArrayParser(this.source.substr(this.position - 1), this.transform);
            this.entries.push(parser.parse(true));
            this.position += parser.position - 2;
          }
        } else if (character.value === "}" && !quote) {
          this.dimension--;
          if (!this.dimension) {
            this.newEntry();
            if (nested)
              return this.entries;
          }
        } else if (character.value === '"' && !character.escaped) {
          if (quote)
            this.newEntry(true);
          quote = !quote;
        } else if (character.value === "," && !quote) {
          this.newEntry();
        } else {
          this.record(character.value);
        }
      }
      if (this.dimension !== 0) {
        throw new Error("array dimension not balanced");
      }
      return this.entries;
    }
  }
  function identity(value) {
    return value;
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS((exports, module) => {
  var array = require_postgres_array();
  module.exports = {
    create: function(source, transform) {
      return {
        parse: function() {
          return array.parse(source, transform);
        }
      };
    }
  };
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS((exports, module) => {
  var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
  var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
  var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
  var INFINITY = /^-?infinity$/;
  module.exports = function parseDate(isoDate) {
    if (INFINITY.test(isoDate)) {
      return Number(isoDate.replace("i", "I"));
    }
    var matches = DATE_TIME.exec(isoDate);
    if (!matches) {
      return getDate(isoDate) || null;
    }
    var isBC = !!matches[8];
    var year = parseInt(matches[1], 10);
    if (isBC) {
      year = bcYearToNegativeYear(year);
    }
    var month = parseInt(matches[2], 10) - 1;
    var day = matches[3];
    var hour = parseInt(matches[4], 10);
    var minute = parseInt(matches[5], 10);
    var second = parseInt(matches[6], 10);
    var ms = matches[7];
    ms = ms ? 1000 * parseFloat(ms) : 0;
    var date;
    var offset = timeZoneOffset(isoDate);
    if (offset != null) {
      date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
      if (is0To99(year)) {
        date.setUTCFullYear(year);
      }
      if (offset !== 0) {
        date.setTime(date.getTime() - offset);
      }
    } else {
      date = new Date(year, month, day, hour, minute, second, ms);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
    }
    return date;
  };
  function getDate(isoDate) {
    var matches = DATE.exec(isoDate);
    if (!matches) {
      return;
    }
    var year = parseInt(matches[1], 10);
    var isBC = !!matches[4];
    if (isBC) {
      year = bcYearToNegativeYear(year);
    }
    var month = parseInt(matches[2], 10) - 1;
    var day = matches[3];
    var date = new Date(year, month, day);
    if (is0To99(year)) {
      date.setFullYear(year);
    }
    return date;
  }
  function timeZoneOffset(isoDate) {
    if (isoDate.endsWith("+00")) {
      return 0;
    }
    var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
    if (!zone)
      return;
    var type = zone[1];
    if (type === "Z") {
      return 0;
    }
    var sign = type === "-" ? -1 : 1;
    var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
    return offset * sign * 1000;
  }
  function bcYearToNegativeYear(year) {
    return -(year - 1);
  }
  function is0To99(num) {
    return num >= 0 && num < 100;
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS((exports, module) => {
  module.exports = extend;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function extend(target) {
    for (var i = 1;i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS((exports, module) => {
  var extend = require_mutable();
  module.exports = PostgresInterval;
  function PostgresInterval(raw) {
    if (!(this instanceof PostgresInterval)) {
      return new PostgresInterval(raw);
    }
    extend(this, parse(raw));
  }
  var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
  PostgresInterval.prototype.toPostgres = function() {
    var filtered = properties.filter(this.hasOwnProperty, this);
    if (this.milliseconds && filtered.indexOf("seconds") < 0) {
      filtered.push("seconds");
    }
    if (filtered.length === 0)
      return "0";
    return filtered.map(function(property) {
      var value = this[property] || 0;
      if (property === "seconds" && this.milliseconds) {
        value = (value + this.milliseconds / 1000).toFixed(6).replace(/\.?0+$/, "");
      }
      return value + " " + property;
    }, this).join(" ");
  };
  var propertiesISOEquivalent = {
    years: "Y",
    months: "M",
    days: "D",
    hours: "H",
    minutes: "M",
    seconds: "S"
  };
  var dateProperties = ["years", "months", "days"];
  var timeProperties = ["hours", "minutes", "seconds"];
  PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
    var datePart = dateProperties.map(buildProperty, this).join("");
    var timePart = timeProperties.map(buildProperty, this).join("");
    return "P" + datePart + "T" + timePart;
    function buildProperty(property) {
      var value = this[property] || 0;
      if (property === "seconds" && this.milliseconds) {
        value = (value + this.milliseconds / 1000).toFixed(6).replace(/0+$/, "");
      }
      return value + propertiesISOEquivalent[property];
    }
  };
  var NUMBER = "([+-]?\\d+)";
  var YEAR = NUMBER + "\\s+years?";
  var MONTH = NUMBER + "\\s+mons?";
  var DAY = NUMBER + "\\s+days?";
  var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
  var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
    return "(" + regexString + ")?";
  }).join("\\s*"));
  var positions = {
    years: 2,
    months: 4,
    days: 6,
    hours: 9,
    minutes: 10,
    seconds: 11,
    milliseconds: 12
  };
  var negatives = ["hours", "minutes", "seconds", "milliseconds"];
  function parseMilliseconds(fraction) {
    var microseconds = fraction + "000000".slice(fraction.length);
    return parseInt(microseconds, 10) / 1000;
  }
  function parse(interval) {
    if (!interval)
      return {};
    var matches = INTERVAL.exec(interval);
    var isNegative = matches[8] === "-";
    return Object.keys(positions).reduce(function(parsed, property) {
      var position = positions[property];
      var value = matches[position];
      if (!value)
        return parsed;
      value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
      if (!value)
        return parsed;
      if (isNegative && ~negatives.indexOf(property)) {
        value *= -1;
      }
      parsed[property] = value;
      return parsed;
    }, {});
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS((exports, module) => {
  module.exports = function parseBytea(input) {
    if (/^\\x/.test(input)) {
      return new Buffer(input.substr(2), "hex");
    }
    var output = "";
    var i = 0;
    while (i < input.length) {
      if (input[i] !== "\\") {
        output += input[i];
        ++i;
      } else {
        if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
          output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
          i += 4;
        } else {
          var backslashes = 1;
          while (i + backslashes < input.length && input[i + backslashes] === "\\") {
            backslashes++;
          }
          for (var k = 0;k < Math.floor(backslashes / 2); ++k) {
            output += "\\";
          }
          i += Math.floor(backslashes / 2) * 2;
        }
      }
    }
    return new Buffer(output, "binary");
  };
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS((exports, module) => {
  var array = require_postgres_array();
  var arrayParser = require_arrayParser();
  var parseDate = require_postgres_date();
  var parseInterval = require_postgres_interval();
  var parseByteA = require_postgres_bytea();
  function allowNull(fn) {
    return function nullAllowed(value) {
      if (value === null)
        return value;
      return fn(value);
    };
  }
  function parseBool(value) {
    if (value === null)
      return value;
    return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
  }
  function parseBoolArray(value) {
    if (!value)
      return null;
    return array.parse(value, parseBool);
  }
  function parseBaseTenInt(string) {
    return parseInt(string, 10);
  }
  function parseIntegerArray(value) {
    if (!value)
      return null;
    return array.parse(value, allowNull(parseBaseTenInt));
  }
  function parseBigIntegerArray(value) {
    if (!value)
      return null;
    return array.parse(value, allowNull(function(entry) {
      return parseBigInteger(entry).trim();
    }));
  }
  var parsePointArray = function(value) {
    if (!value) {
      return null;
    }
    var p = arrayParser.create(value, function(entry) {
      if (entry !== null) {
        entry = parsePoint(entry);
      }
      return entry;
    });
    return p.parse();
  };
  var parseFloatArray = function(value) {
    if (!value) {
      return null;
    }
    var p = arrayParser.create(value, function(entry) {
      if (entry !== null) {
        entry = parseFloat(entry);
      }
      return entry;
    });
    return p.parse();
  };
  var parseStringArray = function(value) {
    if (!value) {
      return null;
    }
    var p = arrayParser.create(value);
    return p.parse();
  };
  var parseDateArray = function(value) {
    if (!value) {
      return null;
    }
    var p = arrayParser.create(value, function(entry) {
      if (entry !== null) {
        entry = parseDate(entry);
      }
      return entry;
    });
    return p.parse();
  };
  var parseIntervalArray = function(value) {
    if (!value) {
      return null;
    }
    var p = arrayParser.create(value, function(entry) {
      if (entry !== null) {
        entry = parseInterval(entry);
      }
      return entry;
    });
    return p.parse();
  };
  var parseByteAArray = function(value) {
    if (!value) {
      return null;
    }
    return array.parse(value, allowNull(parseByteA));
  };
  var parseInteger = function(value) {
    return parseInt(value, 10);
  };
  var parseBigInteger = function(value) {
    var valStr = String(value);
    if (/^\d+$/.test(valStr)) {
      return valStr;
    }
    return value;
  };
  var parseJsonArray = function(value) {
    if (!value) {
      return null;
    }
    return array.parse(value, allowNull(JSON.parse));
  };
  var parsePoint = function(value) {
    if (value[0] !== "(") {
      return null;
    }
    value = value.substring(1, value.length - 1).split(",");
    return {
      x: parseFloat(value[0]),
      y: parseFloat(value[1])
    };
  };
  var parseCircle = function(value) {
    if (value[0] !== "<" && value[1] !== "(") {
      return null;
    }
    var point = "(";
    var radius = "";
    var pointParsed = false;
    for (var i = 2;i < value.length - 1; i++) {
      if (!pointParsed) {
        point += value[i];
      }
      if (value[i] === ")") {
        pointParsed = true;
        continue;
      } else if (!pointParsed) {
        continue;
      }
      if (value[i] === ",") {
        continue;
      }
      radius += value[i];
    }
    var result = parsePoint(point);
    result.radius = parseFloat(radius);
    return result;
  };
  var init = function(register) {
    register(20, parseBigInteger);
    register(21, parseInteger);
    register(23, parseInteger);
    register(26, parseInteger);
    register(700, parseFloat);
    register(701, parseFloat);
    register(16, parseBool);
    register(1082, parseDate);
    register(1114, parseDate);
    register(1184, parseDate);
    register(600, parsePoint);
    register(651, parseStringArray);
    register(718, parseCircle);
    register(1000, parseBoolArray);
    register(1001, parseByteAArray);
    register(1005, parseIntegerArray);
    register(1007, parseIntegerArray);
    register(1028, parseIntegerArray);
    register(1016, parseBigIntegerArray);
    register(1017, parsePointArray);
    register(1021, parseFloatArray);
    register(1022, parseFloatArray);
    register(1231, parseFloatArray);
    register(1014, parseStringArray);
    register(1015, parseStringArray);
    register(1008, parseStringArray);
    register(1009, parseStringArray);
    register(1040, parseStringArray);
    register(1041, parseStringArray);
    register(1115, parseDateArray);
    register(1182, parseDateArray);
    register(1185, parseDateArray);
    register(1186, parseInterval);
    register(1187, parseIntervalArray);
    register(17, parseByteA);
    register(114, JSON.parse.bind(JSON));
    register(3802, JSON.parse.bind(JSON));
    register(199, parseJsonArray);
    register(3807, parseJsonArray);
    register(3907, parseStringArray);
    register(2951, parseStringArray);
    register(791, parseStringArray);
    register(1183, parseStringArray);
    register(1270, parseStringArray);
  };
  module.exports = {
    init
  };
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS((exports, module) => {
  var BASE = 1e6;
  function readInt8(buffer) {
    var high = buffer.readInt32BE(0);
    var low = buffer.readUInt32BE(4);
    var sign = "";
    if (high < 0) {
      high = ~high + (low === 0);
      low = ~low + 1 >>> 0;
      sign = "-";
    }
    var result = "";
    var carry;
    var t;
    var digits;
    var pad;
    var l;
    var i;
    {
      carry = high % BASE;
      high = high / BASE >>> 0;
      t = 4294967296 * carry + low;
      low = t / BASE >>> 0;
      digits = "" + (t - BASE * low);
      if (low === 0 && high === 0) {
        return sign + digits + result;
      }
      pad = "";
      l = 6 - digits.length;
      for (i = 0;i < l; i++) {
        pad += "0";
      }
      result = pad + digits + result;
    }
    {
      carry = high % BASE;
      high = high / BASE >>> 0;
      t = 4294967296 * carry + low;
      low = t / BASE >>> 0;
      digits = "" + (t - BASE * low);
      if (low === 0 && high === 0) {
        return sign + digits + result;
      }
      pad = "";
      l = 6 - digits.length;
      for (i = 0;i < l; i++) {
        pad += "0";
      }
      result = pad + digits + result;
    }
    {
      carry = high % BASE;
      high = high / BASE >>> 0;
      t = 4294967296 * carry + low;
      low = t / BASE >>> 0;
      digits = "" + (t - BASE * low);
      if (low === 0 && high === 0) {
        return sign + digits + result;
      }
      pad = "";
      l = 6 - digits.length;
      for (i = 0;i < l; i++) {
        pad += "0";
      }
      result = pad + digits + result;
    }
    {
      carry = high % BASE;
      t = 4294967296 * carry + low;
      digits = "" + t % BASE;
      return sign + digits + result;
    }
  }
  module.exports = readInt8;
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS((exports, module) => {
  var parseInt64 = require_pg_int8();
  var parseBits = function(data, bits, offset, invert, callback) {
    offset = offset || 0;
    invert = invert || false;
    callback = callback || function(lastValue, newValue, bits2) {
      return lastValue * Math.pow(2, bits2) + newValue;
    };
    var offsetBytes = offset >> 3;
    var inv = function(value) {
      if (invert) {
        return ~value & 255;
      }
      return value;
    };
    var mask = 255;
    var firstBits = 8 - offset % 8;
    if (bits < firstBits) {
      mask = 255 << 8 - bits & 255;
      firstBits = bits;
    }
    if (offset) {
      mask = mask >> offset % 8;
    }
    var result = 0;
    if (offset % 8 + bits >= 8) {
      result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
    }
    var bytes = bits + offset >> 3;
    for (var i = offsetBytes + 1;i < bytes; i++) {
      result = callback(result, inv(data[i]), 8);
    }
    var lastBits = (bits + offset) % 8;
    if (lastBits > 0) {
      result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
    }
    return result;
  };
  var parseFloatFromBits = function(data, precisionBits, exponentBits) {
    var bias = Math.pow(2, exponentBits - 1) - 1;
    var sign = parseBits(data, 1);
    var exponent = parseBits(data, exponentBits, 1);
    if (exponent === 0) {
      return 0;
    }
    var precisionBitsCounter = 1;
    var parsePrecisionBits = function(lastValue, newValue, bits) {
      if (lastValue === 0) {
        lastValue = 1;
      }
      for (var i = 1;i <= bits; i++) {
        precisionBitsCounter /= 2;
        if ((newValue & 1 << bits - i) > 0) {
          lastValue += precisionBitsCounter;
        }
      }
      return lastValue;
    };
    var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
    if (exponent == Math.pow(2, exponentBits + 1) - 1) {
      if (mantissa === 0) {
        return sign === 0 ? Infinity : -Infinity;
      }
      return NaN;
    }
    return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
  };
  var parseInt16 = function(value) {
    if (parseBits(value, 1) == 1) {
      return -1 * (parseBits(value, 15, 1, true) + 1);
    }
    return parseBits(value, 15, 1);
  };
  var parseInt32 = function(value) {
    if (parseBits(value, 1) == 1) {
      return -1 * (parseBits(value, 31, 1, true) + 1);
    }
    return parseBits(value, 31, 1);
  };
  var parseFloat32 = function(value) {
    return parseFloatFromBits(value, 23, 8);
  };
  var parseFloat64 = function(value) {
    return parseFloatFromBits(value, 52, 11);
  };
  var parseNumeric = function(value) {
    var sign = parseBits(value, 16, 32);
    if (sign == 49152) {
      return NaN;
    }
    var weight = Math.pow(1e4, parseBits(value, 16, 16));
    var result = 0;
    var digits = [];
    var ndigits = parseBits(value, 16);
    for (var i = 0;i < ndigits; i++) {
      result += parseBits(value, 16, 64 + 16 * i) * weight;
      weight /= 1e4;
    }
    var scale = Math.pow(10, parseBits(value, 16, 48));
    return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
  };
  var parseDate = function(isUTC, value) {
    var sign = parseBits(value, 1);
    var rawValue = parseBits(value, 63, 1);
    var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1000 + 946684800000);
    if (!isUTC) {
      result.setTime(result.getTime() + result.getTimezoneOffset() * 60000);
    }
    result.usec = rawValue % 1000;
    result.getMicroSeconds = function() {
      return this.usec;
    };
    result.setMicroSeconds = function(value2) {
      this.usec = value2;
    };
    result.getUTCMicroSeconds = function() {
      return this.usec;
    };
    return result;
  };
  var parseArray = function(value) {
    var dim = parseBits(value, 32);
    var flags = parseBits(value, 32, 32);
    var elementType = parseBits(value, 32, 64);
    var offset = 96;
    var dims = [];
    for (var i = 0;i < dim; i++) {
      dims[i] = parseBits(value, 32, offset);
      offset += 32;
      offset += 32;
    }
    var parseElement = function(elementType2) {
      var length = parseBits(value, 32, offset);
      offset += 32;
      if (length == 4294967295) {
        return null;
      }
      var result;
      if (elementType2 == 23 || elementType2 == 20) {
        result = parseBits(value, length * 8, offset);
        offset += length * 8;
        return result;
      } else if (elementType2 == 25) {
        result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
        return result;
      } else {
        console.log("ERROR: ElementType not implemented: " + elementType2);
      }
    };
    var parse = function(dimension, elementType2) {
      var array = [];
      var i2;
      if (dimension.length > 1) {
        var count = dimension.shift();
        for (i2 = 0;i2 < count; i2++) {
          array[i2] = parse(dimension, elementType2);
        }
        dimension.unshift(count);
      } else {
        for (i2 = 0;i2 < dimension[0]; i2++) {
          array[i2] = parseElement(elementType2);
        }
      }
      return array;
    };
    return parse(dims, elementType);
  };
  var parseText = function(value) {
    return value.toString("utf8");
  };
  var parseBool = function(value) {
    if (value === null)
      return null;
    return parseBits(value, 8) > 0;
  };
  var init = function(register) {
    register(20, parseInt64);
    register(21, parseInt16);
    register(23, parseInt32);
    register(26, parseInt32);
    register(1700, parseNumeric);
    register(700, parseFloat32);
    register(701, parseFloat64);
    register(16, parseBool);
    register(1114, parseDate.bind(null, false));
    register(1184, parseDate.bind(null, true));
    register(1000, parseArray);
    register(1007, parseArray);
    register(1016, parseArray);
    register(1008, parseArray);
    register(1009, parseArray);
    register(25, parseText);
  };
  module.exports = {
    init
  };
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS((exports, module) => {
  module.exports = {
    BOOL: 16,
    BYTEA: 17,
    CHAR: 18,
    INT8: 20,
    INT2: 21,
    INT4: 23,
    REGPROC: 24,
    TEXT: 25,
    OID: 26,
    TID: 27,
    XID: 28,
    CID: 29,
    JSON: 114,
    XML: 142,
    PG_NODE_TREE: 194,
    SMGR: 210,
    PATH: 602,
    POLYGON: 604,
    CIDR: 650,
    FLOAT4: 700,
    FLOAT8: 701,
    ABSTIME: 702,
    RELTIME: 703,
    TINTERVAL: 704,
    CIRCLE: 718,
    MACADDR8: 774,
    MONEY: 790,
    MACADDR: 829,
    INET: 869,
    ACLITEM: 1033,
    BPCHAR: 1042,
    VARCHAR: 1043,
    DATE: 1082,
    TIME: 1083,
    TIMESTAMP: 1114,
    TIMESTAMPTZ: 1184,
    INTERVAL: 1186,
    TIMETZ: 1266,
    BIT: 1560,
    VARBIT: 1562,
    NUMERIC: 1700,
    REFCURSOR: 1790,
    REGPROCEDURE: 2202,
    REGOPER: 2203,
    REGOPERATOR: 2204,
    REGCLASS: 2205,
    REGTYPE: 2206,
    UUID: 2950,
    TXID_SNAPSHOT: 2970,
    PG_LSN: 3220,
    PG_NDISTINCT: 3361,
    PG_DEPENDENCIES: 3402,
    TSVECTOR: 3614,
    TSQUERY: 3615,
    GTSVECTOR: 3642,
    REGCONFIG: 3734,
    REGDICTIONARY: 3769,
    JSONB: 3802,
    REGNAMESPACE: 4089,
    REGROLE: 4096
  };
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS((exports) => {
  var textParsers = require_textParsers();
  var binaryParsers = require_binaryParsers();
  var arrayParser = require_arrayParser();
  var builtinTypes = require_builtins();
  exports.getTypeParser = getTypeParser;
  exports.setTypeParser = setTypeParser;
  exports.arrayParser = arrayParser;
  exports.builtins = builtinTypes;
  var typeParsers = {
    text: {},
    binary: {}
  };
  function noParse(val) {
    return String(val);
  }
  function getTypeParser(oid, format) {
    format = format || "text";
    if (!typeParsers[format]) {
      return noParse;
    }
    return typeParsers[format][oid] || noParse;
  }
  function setTypeParser(oid, format, parseFn) {
    if (typeof format == "function") {
      parseFn = format;
      format = "text";
    }
    typeParsers[format][oid] = parseFn;
  }
  textParsers.init(function(oid, converter) {
    typeParsers.text[oid] = converter;
  });
  binaryParsers.init(function(oid, converter) {
    typeParsers.binary[oid] = converter;
  });
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS((exports, module) => {
  module.exports = {
    host: "localhost",
    user: process.platform === "win32" ? process.env.USERNAME : process.env.USER,
    database: undefined,
    password: null,
    connectionString: undefined,
    port: 5432,
    rows: 0,
    binary: false,
    max: 10,
    idleTimeoutMillis: 30000,
    client_encoding: "",
    ssl: false,
    application_name: undefined,
    fallback_application_name: undefined,
    options: undefined,
    parseInputDatesAsUTC: false,
    statement_timeout: false,
    lock_timeout: false,
    idle_in_transaction_session_timeout: false,
    query_timeout: false,
    connect_timeout: 0,
    keepalives: 1,
    keepalives_idle: 0
  };
  var pgTypes = require_pg_types();
  var parseBigInteger = pgTypes.getTypeParser(20, "text");
  var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
  module.exports.__defineSetter__("parseInt8", function(val) {
    pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
    pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
  });
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS((exports, module) => {
  var defaults = require_defaults();
  var util = __require("util");
  var { isDate } = util.types || util;
  function escapeElement(elementRepresentation) {
    const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
    return '"' + escaped + '"';
  }
  function arrayString(val) {
    let result = "{";
    for (let i = 0;i < val.length; i++) {
      if (i > 0) {
        result = result + ",";
      }
      if (val[i] === null || typeof val[i] === "undefined") {
        result = result + "NULL";
      } else if (Array.isArray(val[i])) {
        result = result + arrayString(val[i]);
      } else if (ArrayBuffer.isView(val[i])) {
        let item = val[i];
        if (!(item instanceof Buffer)) {
          const buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
          if (buf.length === item.byteLength) {
            item = buf;
          } else {
            item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
          }
        }
        result += "\\\\x" + item.toString("hex");
      } else {
        result += escapeElement(prepareValue(val[i]));
      }
    }
    result = result + "}";
    return result;
  }
  var prepareValue = function(val, seen) {
    if (val == null) {
      return null;
    }
    if (typeof val === "object") {
      if (val instanceof Buffer) {
        return val;
      }
      if (ArrayBuffer.isView(val)) {
        const buf = Buffer.from(val.buffer, val.byteOffset, val.byteLength);
        if (buf.length === val.byteLength) {
          return buf;
        }
        return buf.slice(val.byteOffset, val.byteOffset + val.byteLength);
      }
      if (isDate(val)) {
        if (defaults.parseInputDatesAsUTC) {
          return dateToStringUTC(val);
        } else {
          return dateToString(val);
        }
      }
      if (Array.isArray(val)) {
        return arrayString(val);
      }
      return prepareObject(val, seen);
    }
    return val.toString();
  };
  function prepareObject(val, seen) {
    if (val && typeof val.toPostgres === "function") {
      seen = seen || [];
      if (seen.indexOf(val) !== -1) {
        throw new Error('circular reference detected while preparing "' + val + '" for query');
      }
      seen.push(val);
      return prepareValue(val.toPostgres(prepareValue), seen);
    }
    return JSON.stringify(val);
  }
  function dateToString(date) {
    let offset = -date.getTimezoneOffset();
    let year = date.getFullYear();
    const isBCYear = year < 1;
    if (isBCYear)
      year = Math.abs(year) + 1;
    let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
    if (offset < 0) {
      ret += "-";
      offset *= -1;
    } else {
      ret += "+";
    }
    ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
    if (isBCYear)
      ret += " BC";
    return ret;
  }
  function dateToStringUTC(date) {
    let year = date.getUTCFullYear();
    const isBCYear = year < 1;
    if (isBCYear)
      year = Math.abs(year) + 1;
    let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
    ret += "+00:00";
    if (isBCYear)
      ret += " BC";
    return ret;
  }
  function normalizeQueryConfig(config, values, callback) {
    config = typeof config === "string" ? { text: config } : config;
    if (values) {
      if (typeof values === "function") {
        config.callback = values;
      } else {
        config.values = values;
      }
    }
    if (callback) {
      config.callback = callback;
    }
    return config;
  }
  var escapeIdentifier = function(str) {
    return '"' + str.replace(/"/g, '""') + '"';
  };
  var escapeLiteral = function(str) {
    let hasBackslash = false;
    let escaped = "'";
    if (str == null) {
      return "''";
    }
    if (typeof str !== "string") {
      return "''";
    }
    for (let i = 0;i < str.length; i++) {
      const c = str[i];
      if (c === "'") {
        escaped += c + c;
      } else if (c === "\\") {
        escaped += c + c;
        hasBackslash = true;
      } else {
        escaped += c;
      }
    }
    escaped += "'";
    if (hasBackslash === true) {
      escaped = " E" + escaped;
    }
    return escaped;
  };
  module.exports = {
    prepareValue: function prepareValueWrapper(value) {
      return prepareValue(value);
    },
    normalizeQueryConfig,
    escapeIdentifier,
    escapeLiteral
  };
});

// node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = __commonJS((exports, module) => {
  var nodeCrypto = __require("crypto");
  function md5(string) {
    return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
  }
  function postgresMd5PasswordHash(user, password, salt) {
    const inner = md5(password + user);
    const outer = md5(Buffer.concat([Buffer.from(inner), salt]));
    return "md5" + outer;
  }
  function sha256(text) {
    return nodeCrypto.createHash("sha256").update(text).digest();
  }
  function hashByName(hashName, text) {
    hashName = hashName.replace(/(\D)-/, "$1");
    return nodeCrypto.createHash(hashName).update(text).digest();
  }
  function hmacSha256(key, msg) {
    return nodeCrypto.createHmac("sha256", key).update(msg).digest();
  }
  async function deriveKey(password, salt, iterations) {
    return nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  }
  module.exports = {
    postgresMd5PasswordHash,
    randomBytes: nodeCrypto.randomBytes,
    deriveKey,
    sha256,
    hashByName,
    hmacSha256,
    md5
  };
});

// node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = __commonJS((exports, module) => {
  var nodeCrypto = __require("crypto");
  module.exports = {
    postgresMd5PasswordHash,
    randomBytes,
    deriveKey,
    sha256,
    hashByName,
    hmacSha256,
    md5
  };
  var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
  var subtleCrypto = webCrypto.subtle;
  var textEncoder = new TextEncoder;
  function randomBytes(length) {
    return webCrypto.getRandomValues(Buffer.alloc(length));
  }
  async function md5(string) {
    try {
      return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
    } catch (e) {
      const data = typeof string === "string" ? textEncoder.encode(string) : string;
      const hash = await subtleCrypto.digest("MD5", data);
      return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  async function postgresMd5PasswordHash(user, password, salt) {
    const inner = await md5(password + user);
    const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
    return "md5" + outer;
  }
  async function sha256(text) {
    return await subtleCrypto.digest("SHA-256", text);
  }
  async function hashByName(hashName, text) {
    return await subtleCrypto.digest(hashName, text);
  }
  async function hmacSha256(keyBuffer, msg) {
    const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
  }
  async function deriveKey(password, salt, iterations) {
    const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
    return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS((exports, module) => {
  var useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15;
  if (useLegacyCrypto) {
    module.exports = require_utils_legacy();
  } else {
    module.exports = require_utils_webcrypto();
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS((exports, module) => {
  function x509Error(msg, cert) {
    return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
  }
  function readASN1Length(data, index) {
    let length = data[index++];
    if (length < 128)
      return { length, index };
    const lengthBytes = length & 127;
    if (lengthBytes > 4)
      throw x509Error("bad length", data);
    length = 0;
    for (let i = 0;i < lengthBytes; i++) {
      length = length << 8 | data[index++];
    }
    return { length, index };
  }
  function readASN1OID(data, index) {
    if (data[index++] !== 6)
      throw x509Error("non-OID data", data);
    const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
    index = indexAfterOIDLength;
    const lastIndex = index + OIDLength;
    const byte1 = data[index++];
    let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
    while (index < lastIndex) {
      let value = 0;
      while (index < lastIndex) {
        const nextByte = data[index++];
        value = value << 7 | nextByte & 127;
        if (nextByte < 128)
          break;
      }
      oid += "." + value;
    }
    return { oid, index };
  }
  function expectASN1Seq(data, index) {
    if (data[index++] !== 48)
      throw x509Error("non-sequence data", data);
    return readASN1Length(data, index);
  }
  function signatureAlgorithmHashFromCertificate(data, index) {
    if (index === undefined)
      index = 0;
    index = expectASN1Seq(data, index).index;
    const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
    index = indexAfterCertInfoLength + certInfoLength;
    index = expectASN1Seq(data, index).index;
    const { oid, index: indexAfterOID } = readASN1OID(data, index);
    switch (oid) {
      case "1.2.840.113549.1.1.4":
        return "MD5";
      case "1.2.840.113549.1.1.5":
        return "SHA-1";
      case "1.2.840.113549.1.1.11":
        return "SHA-256";
      case "1.2.840.113549.1.1.12":
        return "SHA-384";
      case "1.2.840.113549.1.1.13":
        return "SHA-512";
      case "1.2.840.113549.1.1.14":
        return "SHA-224";
      case "1.2.840.113549.1.1.15":
        return "SHA512-224";
      case "1.2.840.113549.1.1.16":
        return "SHA512-256";
      case "1.2.840.10045.4.1":
        return "SHA-1";
      case "1.2.840.10045.4.3.1":
        return "SHA-224";
      case "1.2.840.10045.4.3.2":
        return "SHA-256";
      case "1.2.840.10045.4.3.3":
        return "SHA-384";
      case "1.2.840.10045.4.3.4":
        return "SHA-512";
      case "1.2.840.113549.1.1.10": {
        index = indexAfterOID;
        index = expectASN1Seq(data, index).index;
        if (data[index++] !== 160)
          throw x509Error("non-tag data", data);
        index = readASN1Length(data, index).index;
        index = expectASN1Seq(data, index).index;
        const { oid: hashOID } = readASN1OID(data, index);
        switch (hashOID) {
          case "1.2.840.113549.2.5":
            return "MD5";
          case "1.3.14.3.2.26":
            return "SHA-1";
          case "2.16.840.1.101.3.4.2.1":
            return "SHA-256";
          case "2.16.840.1.101.3.4.2.2":
            return "SHA-384";
          case "2.16.840.1.101.3.4.2.3":
            return "SHA-512";
        }
        throw x509Error("unknown hash OID " + hashOID, data);
      }
      case "1.3.101.110":
      case "1.3.101.112":
        return "SHA-512";
      case "1.3.101.111":
      case "1.3.101.113":
        throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
    }
    throw x509Error("unknown OID " + oid, data);
  }
  module.exports = { signatureAlgorithmHashFromCertificate };
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS((exports, module) => {
  var crypto = require_utils2();
  var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
  function startSession(mechanisms, stream) {
    const candidates = ["SCRAM-SHA-256"];
    if (stream)
      candidates.unshift("SCRAM-SHA-256-PLUS");
    const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
    if (!mechanism) {
      throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
    }
    if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
      throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
    }
    const clientNonce = crypto.randomBytes(18).toString("base64");
    const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
    return {
      mechanism,
      clientNonce,
      response: gs2Header + ",,n=*,r=" + clientNonce,
      message: "SASLInitialResponse"
    };
  }
  async function continueSession(session, password, serverData, stream) {
    if (session.message !== "SASLInitialResponse") {
      throw new Error("SASL: Last message was not SASLInitialResponse");
    }
    if (typeof password !== "string") {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
    }
    if (password === "") {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
    }
    if (typeof serverData !== "string") {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
    }
    const sv = parseServerFirstMessage(serverData);
    if (!sv.nonce.startsWith(session.clientNonce)) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
    } else if (sv.nonce.length === session.clientNonce.length) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    }
    const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
    const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
    let channelBinding = stream ? "eSws" : "biws";
    if (session.mechanism === "SCRAM-SHA-256-PLUS") {
      const peerCert = stream.getPeerCertificate().raw;
      let hashName = signatureAlgorithmHashFromCertificate(peerCert);
      if (hashName === "MD5" || hashName === "SHA-1")
        hashName = "SHA-256";
      const certHash = await crypto.hashByName(hashName, peerCert);
      const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
      channelBinding = bindingData.toString("base64");
    }
    const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
    const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
    const saltBytes = Buffer.from(sv.salt, "base64");
    const saltedPassword = await crypto.deriveKey(password, saltBytes, sv.iteration);
    const clientKey = await crypto.hmacSha256(saltedPassword, "Client Key");
    const storedKey = await crypto.sha256(clientKey);
    const clientSignature = await crypto.hmacSha256(storedKey, authMessage);
    const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
    const serverKey = await crypto.hmacSha256(saltedPassword, "Server Key");
    const serverSignatureBytes = await crypto.hmacSha256(serverKey, authMessage);
    session.message = "SASLResponse";
    session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
    session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
  }
  function finalizeSession(session, serverData) {
    if (session.message !== "SASLResponse") {
      throw new Error("SASL: Last message was not SASLResponse");
    }
    if (typeof serverData !== "string") {
      throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
    }
    const { serverSignature } = parseServerFinalMessage(serverData);
    if (serverSignature !== session.serverSignature) {
      throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
    }
  }
  function isPrintableChars(text) {
    if (typeof text !== "string") {
      throw new TypeError("SASL: text must be a string");
    }
    return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
  }
  function isBase64(text) {
    return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
  }
  function parseAttributePairs(text) {
    if (typeof text !== "string") {
      throw new TypeError("SASL: attribute pairs text must be a string");
    }
    return new Map(text.split(",").map((attrValue) => {
      if (!/^.=/.test(attrValue)) {
        throw new Error("SASL: Invalid attribute pair entry");
      }
      const name = attrValue[0];
      const value = attrValue.substring(2);
      return [name, value];
    }));
  }
  function parseServerFirstMessage(data) {
    const attrPairs = parseAttributePairs(data);
    const nonce = attrPairs.get("r");
    if (!nonce) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
    } else if (!isPrintableChars(nonce)) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
    }
    const salt = attrPairs.get("s");
    if (!salt) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
    } else if (!isBase64(salt)) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
    }
    const iterationText = attrPairs.get("i");
    if (!iterationText) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
    } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
    }
    const iteration = parseInt(iterationText, 10);
    return {
      nonce,
      salt,
      iteration
    };
  }
  function parseServerFinalMessage(serverData) {
    const attrPairs = parseAttributePairs(serverData);
    const serverSignature = attrPairs.get("v");
    if (!serverSignature) {
      throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
    } else if (!isBase64(serverSignature)) {
      throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
    }
    return {
      serverSignature
    };
  }
  function xorBuffers(a, b) {
    if (!Buffer.isBuffer(a)) {
      throw new TypeError("first argument must be a Buffer");
    }
    if (!Buffer.isBuffer(b)) {
      throw new TypeError("second argument must be a Buffer");
    }
    if (a.length !== b.length) {
      throw new Error("Buffer lengths must match");
    }
    if (a.length === 0) {
      throw new Error("Buffers cannot be empty");
    }
    return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
  }
  module.exports = {
    startSession,
    continueSession,
    finalizeSession
  };
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS((exports, module) => {
  var types = require_pg_types();
  function TypeOverrides(userTypes) {
    this._types = userTypes || types;
    this.text = {};
    this.binary = {};
  }
  TypeOverrides.prototype.getOverrides = function(format) {
    switch (format) {
      case "text":
        return this.text;
      case "binary":
        return this.binary;
      default:
        return {};
    }
  };
  TypeOverrides.prototype.setTypeParser = function(oid, format, parseFn) {
    if (typeof format === "function") {
      parseFn = format;
      format = "text";
    }
    this.getOverrides(format)[oid] = parseFn;
  };
  TypeOverrides.prototype.getTypeParser = function(oid, format) {
    format = format || "text";
    return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
  };
  module.exports = TypeOverrides;
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS((exports, module) => {
  function parse(str, options = {}) {
    if (str.charAt(0) === "/") {
      const config2 = str.split(" ");
      return { host: config2[0], database: config2[1] };
    }
    const config = {};
    let result;
    let dummyHost = false;
    if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
      str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
    }
    try {
      try {
        result = new URL(str, "postgres://base");
      } catch (e) {
        result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
        dummyHost = true;
      }
    } catch (err) {
      err.input && (err.input = "*****REDACTED*****");
    }
    for (const entry of result.searchParams.entries()) {
      config[entry[0]] = entry[1];
    }
    config.user = config.user || decodeURIComponent(result.username);
    config.password = config.password || decodeURIComponent(result.password);
    if (result.protocol == "socket:") {
      config.host = decodeURI(result.pathname);
      config.database = result.searchParams.get("db");
      config.client_encoding = result.searchParams.get("encoding");
      return config;
    }
    const hostname = dummyHost ? "" : result.hostname;
    if (!config.host) {
      config.host = decodeURIComponent(hostname);
    } else if (hostname && /^%2f/i.test(hostname)) {
      result.pathname = hostname + result.pathname;
    }
    if (!config.port) {
      config.port = result.port;
    }
    const pathname = result.pathname.slice(1) || null;
    config.database = pathname ? decodeURI(pathname) : null;
    if (config.ssl === "true" || config.ssl === "1") {
      config.ssl = true;
    }
    if (config.ssl === "0") {
      config.ssl = false;
    }
    if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) {
      config.ssl = {};
    }
    const fs = config.sslcert || config.sslkey || config.sslrootcert ? __require("fs") : null;
    if (config.sslcert) {
      config.ssl.cert = fs.readFileSync(config.sslcert).toString();
    }
    if (config.sslkey) {
      config.ssl.key = fs.readFileSync(config.sslkey).toString();
    }
    if (config.sslrootcert) {
      config.ssl.ca = fs.readFileSync(config.sslrootcert).toString();
    }
    if (options.useLibpqCompat && config.uselibpqcompat) {
      throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
    }
    if (config.uselibpqcompat === "true" || options.useLibpqCompat) {
      switch (config.sslmode) {
        case "disable": {
          config.ssl = false;
          break;
        }
        case "prefer": {
          config.ssl.rejectUnauthorized = false;
          break;
        }
        case "require": {
          if (config.sslrootcert) {
            config.ssl.checkServerIdentity = function() {};
          } else {
            config.ssl.rejectUnauthorized = false;
          }
          break;
        }
        case "verify-ca": {
          if (!config.ssl.ca) {
            throw new Error("SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security.");
          }
          config.ssl.checkServerIdentity = function() {};
          break;
        }
        case "verify-full": {
          break;
        }
      }
    } else {
      switch (config.sslmode) {
        case "disable": {
          config.ssl = false;
          break;
        }
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full": {
          break;
        }
        case "no-verify": {
          config.ssl.rejectUnauthorized = false;
          break;
        }
      }
    }
    return config;
  }
  function toConnectionOptions(sslConfig) {
    const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
      if (value !== undefined && value !== null) {
        c[key] = value;
      }
      return c;
    }, {});
    return connectionOptions;
  }
  function toClientConfig(config) {
    const poolConfig = Object.entries(config).reduce((c, [key, value]) => {
      if (key === "ssl") {
        const sslConfig = value;
        if (typeof sslConfig === "boolean") {
          c[key] = sslConfig;
        }
        if (typeof sslConfig === "object") {
          c[key] = toConnectionOptions(sslConfig);
        }
      } else if (value !== undefined && value !== null) {
        if (key === "port") {
          if (value !== "") {
            const v = parseInt(value, 10);
            if (isNaN(v)) {
              throw new Error(`Invalid ${key}: ${value}`);
            }
            c[key] = v;
          }
        } else {
          c[key] = value;
        }
      }
      return c;
    }, {});
    return poolConfig;
  }
  function parseIntoClientConfig(str) {
    return toClientConfig(parse(str));
  }
  module.exports = parse;
  parse.parse = parse;
  parse.toClientConfig = toClientConfig;
  parse.parseIntoClientConfig = parseIntoClientConfig;
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS((exports, module) => {
  var dns = __require("dns");
  var defaults = require_defaults();
  var parse = require_pg_connection_string().parse;
  var val = function(key, config, envVar) {
    if (envVar === undefined) {
      envVar = process.env["PG" + key.toUpperCase()];
    } else if (envVar === false) {} else {
      envVar = process.env[envVar];
    }
    return config[key] || envVar || defaults[key];
  };
  var readSSLConfigFromEnvironment = function() {
    switch (process.env.PGSSLMODE) {
      case "disable":
        return false;
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        return true;
      case "no-verify":
        return { rejectUnauthorized: false };
    }
    return defaults.ssl;
  };
  var quoteParamValue = function(value) {
    return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  };
  var add = function(params, config, paramName) {
    const value = config[paramName];
    if (value !== undefined && value !== null) {
      params.push(paramName + "=" + quoteParamValue(value));
    }
  };

  class ConnectionParameters {
    constructor(config) {
      config = typeof config === "string" ? parse(config) : config || {};
      if (config.connectionString) {
        config = Object.assign({}, config, parse(config.connectionString));
      }
      this.user = val("user", config);
      this.database = val("database", config);
      if (this.database === undefined) {
        this.database = this.user;
      }
      this.port = parseInt(val("port", config), 10);
      this.host = val("host", config);
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: val("password", config)
      });
      this.binary = val("binary", config);
      this.options = val("options", config);
      this.ssl = typeof config.ssl === "undefined" ? readSSLConfigFromEnvironment() : config.ssl;
      if (typeof this.ssl === "string") {
        if (this.ssl === "true") {
          this.ssl = true;
        }
      }
      if (this.ssl === "no-verify") {
        this.ssl = { rejectUnauthorized: false };
      }
      if (this.ssl && this.ssl.key) {
        Object.defineProperty(this.ssl, "key", {
          enumerable: false
        });
      }
      this.client_encoding = val("client_encoding", config);
      this.replication = val("replication", config);
      this.isDomainSocket = !(this.host || "").indexOf("/");
      this.application_name = val("application_name", config, "PGAPPNAME");
      this.fallback_application_name = val("fallback_application_name", config, false);
      this.statement_timeout = val("statement_timeout", config, false);
      this.lock_timeout = val("lock_timeout", config, false);
      this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config, false);
      this.query_timeout = val("query_timeout", config, false);
      if (config.connectionTimeoutMillis === undefined) {
        this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
      } else {
        this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1000);
      }
      if (config.keepAlive === false) {
        this.keepalives = 0;
      } else if (config.keepAlive === true) {
        this.keepalives = 1;
      }
      if (typeof config.keepAliveInitialDelayMillis === "number") {
        this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1000);
      }
    }
    getLibpqConnectionString(cb) {
      const params = [];
      add(params, this, "user");
      add(params, this, "password");
      add(params, this, "port");
      add(params, this, "application_name");
      add(params, this, "fallback_application_name");
      add(params, this, "connect_timeout");
      add(params, this, "options");
      const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
      add(params, ssl, "sslmode");
      add(params, ssl, "sslca");
      add(params, ssl, "sslkey");
      add(params, ssl, "sslcert");
      add(params, ssl, "sslrootcert");
      if (this.database) {
        params.push("dbname=" + quoteParamValue(this.database));
      }
      if (this.replication) {
        params.push("replication=" + quoteParamValue(this.replication));
      }
      if (this.host) {
        params.push("host=" + quoteParamValue(this.host));
      }
      if (this.isDomainSocket) {
        return cb(null, params.join(" "));
      }
      if (this.client_encoding) {
        params.push("client_encoding=" + quoteParamValue(this.client_encoding));
      }
      dns.lookup(this.host, function(err, address) {
        if (err)
          return cb(err, null);
        params.push("hostaddr=" + quoteParamValue(address));
        return cb(null, params.join(" "));
      });
    }
  }
  module.exports = ConnectionParameters;
});

// node_modules/pg/lib/result.js
var require_result = __commonJS((exports, module) => {
  var types = require_pg_types();
  var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;

  class Result {
    constructor(rowMode, types2) {
      this.command = null;
      this.rowCount = null;
      this.oid = null;
      this.rows = [];
      this.fields = [];
      this._parsers = undefined;
      this._types = types2;
      this.RowCtor = null;
      this.rowAsArray = rowMode === "array";
      if (this.rowAsArray) {
        this.parseRow = this._parseRowAsArray;
      }
      this._prebuiltEmptyResultObject = null;
    }
    addCommandComplete(msg) {
      let match;
      if (msg.text) {
        match = matchRegexp.exec(msg.text);
      } else {
        match = matchRegexp.exec(msg.command);
      }
      if (match) {
        this.command = match[1];
        if (match[3]) {
          this.oid = parseInt(match[2], 10);
          this.rowCount = parseInt(match[3], 10);
        } else if (match[2]) {
          this.rowCount = parseInt(match[2], 10);
        }
      }
    }
    _parseRowAsArray(rowData) {
      const row = new Array(rowData.length);
      for (let i = 0, len = rowData.length;i < len; i++) {
        const rawValue = rowData[i];
        if (rawValue !== null) {
          row[i] = this._parsers[i](rawValue);
        } else {
          row[i] = null;
        }
      }
      return row;
    }
    parseRow(rowData) {
      const row = { ...this._prebuiltEmptyResultObject };
      for (let i = 0, len = rowData.length;i < len; i++) {
        const rawValue = rowData[i];
        const field = this.fields[i].name;
        if (rawValue !== null) {
          const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
          row[field] = this._parsers[i](v);
        } else {
          row[field] = null;
        }
      }
      return row;
    }
    addRow(row) {
      this.rows.push(row);
    }
    addFields(fieldDescriptions) {
      this.fields = fieldDescriptions;
      if (this.fields.length) {
        this._parsers = new Array(fieldDescriptions.length);
      }
      const row = {};
      for (let i = 0;i < fieldDescriptions.length; i++) {
        const desc = fieldDescriptions[i];
        row[desc.name] = null;
        if (this._types) {
          this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
        } else {
          this._parsers[i] = types.getTypeParser(desc.dataTypeID, desc.format || "text");
        }
      }
      this._prebuiltEmptyResultObject = { ...row };
    }
  }
  module.exports = Result;
});

// node_modules/pg/lib/query.js
var require_query = __commonJS((exports, module) => {
  var { EventEmitter } = __require("events");
  var Result = require_result();
  var utils = require_utils();

  class Query extends EventEmitter {
    constructor(config, values, callback) {
      super();
      config = utils.normalizeQueryConfig(config, values, callback);
      this.text = config.text;
      this.values = config.values;
      this.rows = config.rows;
      this.types = config.types;
      this.name = config.name;
      this.queryMode = config.queryMode;
      this.binary = config.binary;
      this.portal = config.portal || "";
      this.callback = config.callback;
      this._rowMode = config.rowMode;
      if (process.domain && config.callback) {
        this.callback = process.domain.bind(config.callback);
      }
      this._result = new Result(this._rowMode, this.types);
      this._results = this._result;
      this._canceledDueToError = false;
    }
    requiresPreparation() {
      if (this.queryMode === "extended") {
        return true;
      }
      if (this.name) {
        return true;
      }
      if (this.rows) {
        return true;
      }
      if (!this.text) {
        return false;
      }
      if (!this.values) {
        return false;
      }
      return this.values.length > 0;
    }
    _checkForMultirow() {
      if (this._result.command) {
        if (!Array.isArray(this._results)) {
          this._results = [this._result];
        }
        this._result = new Result(this._rowMode, this._result._types);
        this._results.push(this._result);
      }
    }
    handleRowDescription(msg) {
      this._checkForMultirow();
      this._result.addFields(msg.fields);
      this._accumulateRows = this.callback || !this.listeners("row").length;
    }
    handleDataRow(msg) {
      let row;
      if (this._canceledDueToError) {
        return;
      }
      try {
        row = this._result.parseRow(msg.fields);
      } catch (err) {
        this._canceledDueToError = err;
        return;
      }
      this.emit("row", row, this._result);
      if (this._accumulateRows) {
        this._result.addRow(row);
      }
    }
    handleCommandComplete(msg, connection) {
      this._checkForMultirow();
      this._result.addCommandComplete(msg);
      if (this.rows) {
        connection.sync();
      }
    }
    handleEmptyQuery(connection) {
      if (this.rows) {
        connection.sync();
      }
    }
    handleError(err, connection) {
      if (this._canceledDueToError) {
        err = this._canceledDueToError;
        this._canceledDueToError = false;
      }
      if (this.callback) {
        return this.callback(err);
      }
      this.emit("error", err);
    }
    handleReadyForQuery(con) {
      if (this._canceledDueToError) {
        return this.handleError(this._canceledDueToError, con);
      }
      if (this.callback) {
        try {
          this.callback(null, this._results);
        } catch (err) {
          process.nextTick(() => {
            throw err;
          });
        }
      }
      this.emit("end", this._results);
    }
    submit(connection) {
      if (typeof this.text !== "string" && typeof this.name !== "string") {
        return new Error("A query must have either text or a name. Supplying neither is unsupported.");
      }
      const previous = connection.parsedStatements[this.name];
      if (this.text && previous && this.text !== previous) {
        return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
      }
      if (this.values && !Array.isArray(this.values)) {
        return new Error("Query values must be an array");
      }
      if (this.requiresPreparation()) {
        connection.stream.cork && connection.stream.cork();
        try {
          this.prepare(connection);
        } finally {
          connection.stream.uncork && connection.stream.uncork();
        }
      } else {
        connection.query(this.text);
      }
      return null;
    }
    hasBeenParsed(connection) {
      return this.name && connection.parsedStatements[this.name];
    }
    handlePortalSuspended(connection) {
      this._getRows(connection, this.rows);
    }
    _getRows(connection, rows) {
      connection.execute({
        portal: this.portal,
        rows
      });
      if (!rows) {
        connection.sync();
      } else {
        connection.flush();
      }
    }
    prepare(connection) {
      if (!this.hasBeenParsed(connection)) {
        connection.parse({
          text: this.text,
          name: this.name,
          types: this.types
        });
      }
      try {
        connection.bind({
          portal: this.portal,
          statement: this.name,
          values: this.values,
          binary: this.binary,
          valueMapper: utils.prepareValue
        });
      } catch (err) {
        this.handleError(err, connection);
        return;
      }
      connection.describe({
        type: "P",
        name: this.portal || ""
      });
      this._getRows(connection, this.rows);
    }
    handleCopyInResponse(connection) {
      connection.sendCopyFail("No source stream defined");
    }
    handleCopyData(msg, connection) {}
  }
  module.exports = Query;
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = undefined;
  exports.parseComplete = {
    name: "parseComplete",
    length: 5
  };
  exports.bindComplete = {
    name: "bindComplete",
    length: 5
  };
  exports.closeComplete = {
    name: "closeComplete",
    length: 5
  };
  exports.noData = {
    name: "noData",
    length: 5
  };
  exports.portalSuspended = {
    name: "portalSuspended",
    length: 5
  };
  exports.replicationStart = {
    name: "replicationStart",
    length: 4
  };
  exports.emptyQuery = {
    name: "emptyQuery",
    length: 4
  };
  exports.copyDone = {
    name: "copyDone",
    length: 4
  };

  class DatabaseError extends Error {
    constructor(message, length, name) {
      super(message);
      this.length = length;
      this.name = name;
    }
  }
  exports.DatabaseError = DatabaseError;

  class CopyDataMessage {
    constructor(length, chunk) {
      this.length = length;
      this.chunk = chunk;
      this.name = "copyData";
    }
  }
  exports.CopyDataMessage = CopyDataMessage;

  class CopyResponse {
    constructor(length, name, binary, columnCount) {
      this.length = length;
      this.name = name;
      this.binary = binary;
      this.columnTypes = new Array(columnCount);
    }
  }
  exports.CopyResponse = CopyResponse;

  class Field {
    constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
      this.name = name;
      this.tableID = tableID;
      this.columnID = columnID;
      this.dataTypeID = dataTypeID;
      this.dataTypeSize = dataTypeSize;
      this.dataTypeModifier = dataTypeModifier;
      this.format = format;
    }
  }
  exports.Field = Field;

  class RowDescriptionMessage {
    constructor(length, fieldCount) {
      this.length = length;
      this.fieldCount = fieldCount;
      this.name = "rowDescription";
      this.fields = new Array(this.fieldCount);
    }
  }
  exports.RowDescriptionMessage = RowDescriptionMessage;

  class ParameterDescriptionMessage {
    constructor(length, parameterCount) {
      this.length = length;
      this.parameterCount = parameterCount;
      this.name = "parameterDescription";
      this.dataTypeIDs = new Array(this.parameterCount);
    }
  }
  exports.ParameterDescriptionMessage = ParameterDescriptionMessage;

  class ParameterStatusMessage {
    constructor(length, parameterName, parameterValue) {
      this.length = length;
      this.parameterName = parameterName;
      this.parameterValue = parameterValue;
      this.name = "parameterStatus";
    }
  }
  exports.ParameterStatusMessage = ParameterStatusMessage;

  class AuthenticationMD5Password {
    constructor(length, salt) {
      this.length = length;
      this.salt = salt;
      this.name = "authenticationMD5Password";
    }
  }
  exports.AuthenticationMD5Password = AuthenticationMD5Password;

  class BackendKeyDataMessage {
    constructor(length, processID, secretKey) {
      this.length = length;
      this.processID = processID;
      this.secretKey = secretKey;
      this.name = "backendKeyData";
    }
  }
  exports.BackendKeyDataMessage = BackendKeyDataMessage;

  class NotificationResponseMessage {
    constructor(length, processId, channel, payload) {
      this.length = length;
      this.processId = processId;
      this.channel = channel;
      this.payload = payload;
      this.name = "notification";
    }
  }
  exports.NotificationResponseMessage = NotificationResponseMessage;

  class ReadyForQueryMessage {
    constructor(length, status) {
      this.length = length;
      this.status = status;
      this.name = "readyForQuery";
    }
  }
  exports.ReadyForQueryMessage = ReadyForQueryMessage;

  class CommandCompleteMessage {
    constructor(length, text) {
      this.length = length;
      this.text = text;
      this.name = "commandComplete";
    }
  }
  exports.CommandCompleteMessage = CommandCompleteMessage;

  class DataRowMessage {
    constructor(length, fields) {
      this.length = length;
      this.fields = fields;
      this.name = "dataRow";
      this.fieldCount = fields.length;
    }
  }
  exports.DataRowMessage = DataRowMessage;

  class NoticeMessage {
    constructor(length, message) {
      this.length = length;
      this.message = message;
      this.name = "notice";
    }
  }
  exports.NoticeMessage = NoticeMessage;
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Writer = undefined;

  class Writer {
    constructor(size = 256) {
      this.size = size;
      this.offset = 5;
      this.headerPosition = 0;
      this.buffer = Buffer.allocUnsafe(size);
    }
    ensure(size) {
      const remaining = this.buffer.length - this.offset;
      if (remaining < size) {
        const oldBuffer = this.buffer;
        const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
        this.buffer = Buffer.allocUnsafe(newSize);
        oldBuffer.copy(this.buffer);
      }
    }
    addInt32(num) {
      this.ensure(4);
      this.buffer[this.offset++] = num >>> 24 & 255;
      this.buffer[this.offset++] = num >>> 16 & 255;
      this.buffer[this.offset++] = num >>> 8 & 255;
      this.buffer[this.offset++] = num >>> 0 & 255;
      return this;
    }
    addInt16(num) {
      this.ensure(2);
      this.buffer[this.offset++] = num >>> 8 & 255;
      this.buffer[this.offset++] = num >>> 0 & 255;
      return this;
    }
    addCString(string) {
      if (!string) {
        this.ensure(1);
      } else {
        const len = Buffer.byteLength(string);
        this.ensure(len + 1);
        this.buffer.write(string, this.offset, "utf-8");
        this.offset += len;
      }
      this.buffer[this.offset++] = 0;
      return this;
    }
    addString(string = "") {
      const len = Buffer.byteLength(string);
      this.ensure(len);
      this.buffer.write(string, this.offset);
      this.offset += len;
      return this;
    }
    add(otherBuffer) {
      this.ensure(otherBuffer.length);
      otherBuffer.copy(this.buffer, this.offset);
      this.offset += otherBuffer.length;
      return this;
    }
    join(code) {
      if (code) {
        this.buffer[this.headerPosition] = code;
        const length = this.offset - (this.headerPosition + 1);
        this.buffer.writeInt32BE(length, this.headerPosition + 1);
      }
      return this.buffer.slice(code ? 0 : 5, this.offset);
    }
    flush(code) {
      const result = this.join(code);
      this.offset = 5;
      this.headerPosition = 0;
      this.buffer = Buffer.allocUnsafe(this.size);
      return result;
    }
  }
  exports.Writer = Writer;
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.serialize = undefined;
  var buffer_writer_1 = require_buffer_writer();
  var writer = new buffer_writer_1.Writer;
  var startup = (opts) => {
    writer.addInt16(3).addInt16(0);
    for (const key of Object.keys(opts)) {
      writer.addCString(key).addCString(opts[key]);
    }
    writer.addCString("client_encoding").addCString("UTF8");
    const bodyBuffer = writer.addCString("").flush();
    const length = bodyBuffer.length + 4;
    return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
  };
  var requestSsl = () => {
    const response = Buffer.allocUnsafe(8);
    response.writeInt32BE(8, 0);
    response.writeInt32BE(80877103, 4);
    return response;
  };
  var password = (password2) => {
    return writer.addCString(password2).flush(112);
  };
  var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
    writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
    return writer.flush(112);
  };
  var sendSCRAMClientFinalMessage = function(additionalData) {
    return writer.addString(additionalData).flush(112);
  };
  var query = (text) => {
    return writer.addCString(text).flush(81);
  };
  var emptyArray = [];
  var parse = (query2) => {
    const name = query2.name || "";
    if (name.length > 63) {
      console.error("Warning! Postgres only supports 63 characters for query names.");
      console.error("You supplied %s (%s)", name, name.length);
      console.error("This can cause conflicts and silent errors executing queries");
    }
    const types = query2.types || emptyArray;
    const len = types.length;
    const buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
    for (let i = 0;i < len; i++) {
      buffer.addInt32(types[i]);
    }
    return writer.flush(80);
  };
  var paramWriter = new buffer_writer_1.Writer;
  var writeValues = function(values, valueMapper) {
    for (let i = 0;i < values.length; i++) {
      const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
      if (mappedVal == null) {
        writer.addInt16(0);
        paramWriter.addInt32(-1);
      } else if (mappedVal instanceof Buffer) {
        writer.addInt16(1);
        paramWriter.addInt32(mappedVal.length);
        paramWriter.add(mappedVal);
      } else {
        writer.addInt16(0);
        paramWriter.addInt32(Buffer.byteLength(mappedVal));
        paramWriter.addString(mappedVal);
      }
    }
  };
  var bind = (config = {}) => {
    const portal = config.portal || "";
    const statement = config.statement || "";
    const binary = config.binary || false;
    const values = config.values || emptyArray;
    const len = values.length;
    writer.addCString(portal).addCString(statement);
    writer.addInt16(len);
    writeValues(values, config.valueMapper);
    writer.addInt16(len);
    writer.add(paramWriter.flush());
    writer.addInt16(1);
    writer.addInt16(binary ? 1 : 0);
    return writer.flush(66);
  };
  var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
  var execute = (config) => {
    if (!config || !config.portal && !config.rows) {
      return emptyExecute;
    }
    const portal = config.portal || "";
    const rows = config.rows || 0;
    const portalLength = Buffer.byteLength(portal);
    const len = 4 + portalLength + 1 + 4;
    const buff = Buffer.allocUnsafe(1 + len);
    buff[0] = 69;
    buff.writeInt32BE(len, 1);
    buff.write(portal, 5, "utf-8");
    buff[portalLength + 5] = 0;
    buff.writeUInt32BE(rows, buff.length - 4);
    return buff;
  };
  var cancel = (processID, secretKey) => {
    const buffer = Buffer.allocUnsafe(16);
    buffer.writeInt32BE(16, 0);
    buffer.writeInt16BE(1234, 4);
    buffer.writeInt16BE(5678, 6);
    buffer.writeInt32BE(processID, 8);
    buffer.writeInt32BE(secretKey, 12);
    return buffer;
  };
  var cstringMessage = (code, string) => {
    const stringLen = Buffer.byteLength(string);
    const len = 4 + stringLen + 1;
    const buffer = Buffer.allocUnsafe(1 + len);
    buffer[0] = code;
    buffer.writeInt32BE(len, 1);
    buffer.write(string, 5, "utf-8");
    buffer[len] = 0;
    return buffer;
  };
  var emptyDescribePortal = writer.addCString("P").flush(68);
  var emptyDescribeStatement = writer.addCString("S").flush(68);
  var describe = (msg) => {
    return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
  };
  var close = (msg) => {
    const text = `${msg.type}${msg.name || ""}`;
    return cstringMessage(67, text);
  };
  var copyData = (chunk) => {
    return writer.add(chunk).flush(100);
  };
  var copyFail = (message) => {
    return cstringMessage(102, message);
  };
  var codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]);
  var flushBuffer = codeOnlyBuffer(72);
  var syncBuffer = codeOnlyBuffer(83);
  var endBuffer = codeOnlyBuffer(88);
  var copyDoneBuffer = codeOnlyBuffer(99);
  var serialize = {
    startup,
    password,
    requestSsl,
    sendSASLInitialResponseMessage,
    sendSCRAMClientFinalMessage,
    query,
    parse,
    bind,
    execute,
    describe,
    close,
    flush: () => flushBuffer,
    sync: () => syncBuffer,
    end: () => endBuffer,
    copyData,
    copyDone: () => copyDoneBuffer,
    copyFail,
    cancel
  };
  exports.serialize = serialize;
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BufferReader = undefined;
  var emptyBuffer = Buffer.allocUnsafe(0);

  class BufferReader {
    constructor(offset = 0) {
      this.offset = offset;
      this.buffer = emptyBuffer;
      this.encoding = "utf-8";
    }
    setBuffer(offset, buffer) {
      this.offset = offset;
      this.buffer = buffer;
    }
    int16() {
      const result = this.buffer.readInt16BE(this.offset);
      this.offset += 2;
      return result;
    }
    byte() {
      const result = this.buffer[this.offset];
      this.offset++;
      return result;
    }
    int32() {
      const result = this.buffer.readInt32BE(this.offset);
      this.offset += 4;
      return result;
    }
    uint32() {
      const result = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return result;
    }
    string(length) {
      const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
      this.offset += length;
      return result;
    }
    cstring() {
      const start = this.offset;
      let end = start;
      while (this.buffer[end++] !== 0) {}
      this.offset = end;
      return this.buffer.toString(this.encoding, start, end - 1);
    }
    bytes(length) {
      const result = this.buffer.slice(this.offset, this.offset + length);
      this.offset += length;
      return result;
    }
  }
  exports.BufferReader = BufferReader;
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Parser = undefined;
  var messages_1 = require_messages();
  var buffer_reader_1 = require_buffer_reader();
  var CODE_LENGTH = 1;
  var LEN_LENGTH = 4;
  var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
  var emptyBuffer = Buffer.allocUnsafe(0);

  class Parser {
    constructor(opts) {
      this.buffer = emptyBuffer;
      this.bufferLength = 0;
      this.bufferOffset = 0;
      this.reader = new buffer_reader_1.BufferReader;
      if ((opts === null || opts === undefined ? undefined : opts.mode) === "binary") {
        throw new Error("Binary mode not supported yet");
      }
      this.mode = (opts === null || opts === undefined ? undefined : opts.mode) || "text";
    }
    parse(buffer, callback) {
      this.mergeBuffer(buffer);
      const bufferFullLength = this.bufferOffset + this.bufferLength;
      let offset = this.bufferOffset;
      while (offset + HEADER_LENGTH <= bufferFullLength) {
        const code = this.buffer[offset];
        const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
        const fullMessageLength = CODE_LENGTH + length;
        if (fullMessageLength + offset <= bufferFullLength) {
          const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
          callback(message);
          offset += fullMessageLength;
        } else {
          break;
        }
      }
      if (offset === bufferFullLength) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
      } else {
        this.bufferLength = bufferFullLength - offset;
        this.bufferOffset = offset;
      }
    }
    mergeBuffer(buffer) {
      if (this.bufferLength > 0) {
        const newLength = this.bufferLength + buffer.byteLength;
        const newFullLength = newLength + this.bufferOffset;
        if (newFullLength > this.buffer.byteLength) {
          let newBuffer;
          if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
            newBuffer = this.buffer;
          } else {
            let newBufferLength = this.buffer.byteLength * 2;
            while (newLength >= newBufferLength) {
              newBufferLength *= 2;
            }
            newBuffer = Buffer.allocUnsafe(newBufferLength);
          }
          this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
          this.buffer = newBuffer;
          this.bufferOffset = 0;
        }
        buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
        this.bufferLength = newLength;
      } else {
        this.buffer = buffer;
        this.bufferOffset = 0;
        this.bufferLength = buffer.byteLength;
      }
    }
    handlePacket(offset, code, length, bytes) {
      switch (code) {
        case 50:
          return messages_1.bindComplete;
        case 49:
          return messages_1.parseComplete;
        case 51:
          return messages_1.closeComplete;
        case 110:
          return messages_1.noData;
        case 115:
          return messages_1.portalSuspended;
        case 99:
          return messages_1.copyDone;
        case 87:
          return messages_1.replicationStart;
        case 73:
          return messages_1.emptyQuery;
        case 68:
          return this.parseDataRowMessage(offset, length, bytes);
        case 67:
          return this.parseCommandCompleteMessage(offset, length, bytes);
        case 90:
          return this.parseReadyForQueryMessage(offset, length, bytes);
        case 65:
          return this.parseNotificationMessage(offset, length, bytes);
        case 82:
          return this.parseAuthenticationResponse(offset, length, bytes);
        case 83:
          return this.parseParameterStatusMessage(offset, length, bytes);
        case 75:
          return this.parseBackendKeyData(offset, length, bytes);
        case 69:
          return this.parseErrorMessage(offset, length, bytes, "error");
        case 78:
          return this.parseErrorMessage(offset, length, bytes, "notice");
        case 84:
          return this.parseRowDescriptionMessage(offset, length, bytes);
        case 116:
          return this.parseParameterDescriptionMessage(offset, length, bytes);
        case 71:
          return this.parseCopyInMessage(offset, length, bytes);
        case 72:
          return this.parseCopyOutMessage(offset, length, bytes);
        case 100:
          return this.parseCopyData(offset, length, bytes);
        default:
          return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
      }
    }
    parseReadyForQueryMessage(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const status = this.reader.string(1);
      return new messages_1.ReadyForQueryMessage(length, status);
    }
    parseCommandCompleteMessage(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const text = this.reader.cstring();
      return new messages_1.CommandCompleteMessage(length, text);
    }
    parseCopyData(offset, length, bytes) {
      const chunk = bytes.slice(offset, offset + (length - 4));
      return new messages_1.CopyDataMessage(length, chunk);
    }
    parseCopyInMessage(offset, length, bytes) {
      return this.parseCopyMessage(offset, length, bytes, "copyInResponse");
    }
    parseCopyOutMessage(offset, length, bytes) {
      return this.parseCopyMessage(offset, length, bytes, "copyOutResponse");
    }
    parseCopyMessage(offset, length, bytes, messageName) {
      this.reader.setBuffer(offset, bytes);
      const isBinary = this.reader.byte() !== 0;
      const columnCount = this.reader.int16();
      const message = new messages_1.CopyResponse(length, messageName, isBinary, columnCount);
      for (let i = 0;i < columnCount; i++) {
        message.columnTypes[i] = this.reader.int16();
      }
      return message;
    }
    parseNotificationMessage(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const processId = this.reader.int32();
      const channel = this.reader.cstring();
      const payload = this.reader.cstring();
      return new messages_1.NotificationResponseMessage(length, processId, channel, payload);
    }
    parseRowDescriptionMessage(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const fieldCount = this.reader.int16();
      const message = new messages_1.RowDescriptionMessage(length, fieldCount);
      for (let i = 0;i < fieldCount; i++) {
        message.fields[i] = this.parseField();
      }
      return message;
    }
    parseField() {
      const name = this.reader.cstring();
      const tableID = this.reader.uint32();
      const columnID = this.reader.int16();
      const dataTypeID = this.reader.uint32();
      const dataTypeSize = this.reader.int16();
      const dataTypeModifier = this.reader.int32();
      const mode = this.reader.int16() === 0 ? "text" : "binary";
      return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
    }
    parseParameterDescriptionMessage(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const parameterCount = this.reader.int16();
      const message = new messages_1.ParameterDescriptionMessage(length, parameterCount);
      for (let i = 0;i < parameterCount; i++) {
        message.dataTypeIDs[i] = this.reader.int32();
      }
      return message;
    }
    parseDataRowMessage(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const fieldCount = this.reader.int16();
      const fields = new Array(fieldCount);
      for (let i = 0;i < fieldCount; i++) {
        const len = this.reader.int32();
        fields[i] = len === -1 ? null : this.reader.string(len);
      }
      return new messages_1.DataRowMessage(length, fields);
    }
    parseParameterStatusMessage(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const name = this.reader.cstring();
      const value = this.reader.cstring();
      return new messages_1.ParameterStatusMessage(length, name, value);
    }
    parseBackendKeyData(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const processID = this.reader.int32();
      const secretKey = this.reader.int32();
      return new messages_1.BackendKeyDataMessage(length, processID, secretKey);
    }
    parseAuthenticationResponse(offset, length, bytes) {
      this.reader.setBuffer(offset, bytes);
      const code = this.reader.int32();
      const message = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          if (message.length === 8) {
            message.name = "authenticationCleartextPassword";
          }
          break;
        case 5:
          if (message.length === 12) {
            message.name = "authenticationMD5Password";
            const salt = this.reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(length, salt);
          }
          break;
        case 10:
          {
            message.name = "authenticationSASL";
            message.mechanisms = [];
            let mechanism;
            do {
              mechanism = this.reader.cstring();
              if (mechanism) {
                message.mechanisms.push(mechanism);
              }
            } while (mechanism);
          }
          break;
        case 11:
          message.name = "authenticationSASLContinue";
          message.data = this.reader.string(length - 8);
          break;
        case 12:
          message.name = "authenticationSASLFinal";
          message.data = this.reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message;
    }
    parseErrorMessage(offset, length, bytes, name) {
      this.reader.setBuffer(offset, bytes);
      const fields = {};
      let fieldType = this.reader.string(1);
      while (fieldType !== "\x00") {
        fields[fieldType] = this.reader.cstring();
        fieldType = this.reader.string(1);
      }
      const messageValue = fields.M;
      const message = name === "notice" ? new messages_1.NoticeMessage(length, messageValue) : new messages_1.DatabaseError(messageValue, length, name);
      message.severity = fields.S;
      message.code = fields.C;
      message.detail = fields.D;
      message.hint = fields.H;
      message.position = fields.P;
      message.internalPosition = fields.p;
      message.internalQuery = fields.q;
      message.where = fields.W;
      message.schema = fields.s;
      message.table = fields.t;
      message.column = fields.c;
      message.dataType = fields.d;
      message.constraint = fields.n;
      message.file = fields.F;
      message.line = fields.L;
      message.routine = fields.R;
      return message;
    }
  }
  exports.Parser = Parser;
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DatabaseError = exports.serialize = exports.parse = undefined;
  var messages_1 = require_messages();
  Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function() {
    return messages_1.DatabaseError;
  } });
  var serializer_1 = require_serializer();
  Object.defineProperty(exports, "serialize", { enumerable: true, get: function() {
    return serializer_1.serialize;
  } });
  var parser_1 = require_parser();
  function parse(stream, callback) {
    const parser = new parser_1.Parser;
    stream.on("data", (buffer) => parser.parse(buffer, callback));
    return new Promise((resolve) => stream.on("end", () => resolve()));
  }
  exports.parse = parse;
});

// node_modules/pg-cloudflare/dist/empty.js
var require_empty = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = {};
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS((exports, module) => {
  var { getStream, getSecureStream } = getStreamFuncs();
  module.exports = {
    getStream,
    getSecureStream
  };
  function getNodejsStreamFuncs() {
    function getStream2(ssl) {
      const net = __require("net");
      return new net.Socket;
    }
    function getSecureStream2(options) {
      const tls = __require("tls");
      return tls.connect(options);
    }
    return {
      getStream: getStream2,
      getSecureStream: getSecureStream2
    };
  }
  function getCloudflareStreamFuncs() {
    function getStream2(ssl) {
      const { CloudflareSocket } = require_empty();
      return new CloudflareSocket(ssl);
    }
    function getSecureStream2(options) {
      options.socket.startTls(options);
      return options.socket;
    }
    return {
      getStream: getStream2,
      getSecureStream: getSecureStream2
    };
  }
  function isCloudflareRuntime() {
    if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") {
      return navigator.userAgent === "Cloudflare-Workers";
    }
    if (typeof Response === "function") {
      const resp = new Response(null, { cf: { thing: true } });
      if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
        return true;
      }
    }
    return false;
  }
  function getStreamFuncs() {
    if (isCloudflareRuntime()) {
      return getCloudflareStreamFuncs();
    }
    return getNodejsStreamFuncs();
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS((exports, module) => {
  var EventEmitter = __require("events").EventEmitter;
  var { parse, serialize } = require_dist();
  var { getStream, getSecureStream } = require_stream();
  var flushBuffer = serialize.flush();
  var syncBuffer = serialize.sync();
  var endBuffer = serialize.end();

  class Connection extends EventEmitter {
    constructor(config) {
      super();
      config = config || {};
      this.stream = config.stream || getStream(config.ssl);
      if (typeof this.stream === "function") {
        this.stream = this.stream(config);
      }
      this._keepAlive = config.keepAlive;
      this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis;
      this.lastBuffer = false;
      this.parsedStatements = {};
      this.ssl = config.ssl || false;
      this._ending = false;
      this._emitMessage = false;
      const self = this;
      this.on("newListener", function(eventName) {
        if (eventName === "message") {
          self._emitMessage = true;
        }
      });
    }
    connect(port, host) {
      const self = this;
      this._connecting = true;
      this.stream.setNoDelay(true);
      this.stream.connect(port, host);
      this.stream.once("connect", function() {
        if (self._keepAlive) {
          self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
        }
        self.emit("connect");
      });
      const reportStreamError = function(error) {
        if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
          return;
        }
        self.emit("error", error);
      };
      this.stream.on("error", reportStreamError);
      this.stream.on("close", function() {
        self.emit("end");
      });
      if (!this.ssl) {
        return this.attachListeners(this.stream);
      }
      this.stream.once("data", function(buffer) {
        const responseCode = buffer.toString("utf8");
        switch (responseCode) {
          case "S":
            break;
          case "N":
            self.stream.end();
            return self.emit("error", new Error("The server does not support SSL connections"));
          default:
            self.stream.end();
            return self.emit("error", new Error("There was an error establishing an SSL connection"));
        }
        const options = {
          socket: self.stream
        };
        if (self.ssl !== true) {
          Object.assign(options, self.ssl);
          if ("key" in self.ssl) {
            options.key = self.ssl.key;
          }
        }
        const net = __require("net");
        if (net.isIP && net.isIP(host) === 0) {
          options.servername = host;
        }
        try {
          self.stream = getSecureStream(options);
        } catch (err) {
          return self.emit("error", err);
        }
        self.attachListeners(self.stream);
        self.stream.on("error", reportStreamError);
        self.emit("sslconnect");
      });
    }
    attachListeners(stream) {
      parse(stream, (msg) => {
        const eventName = msg.name === "error" ? "errorMessage" : msg.name;
        if (this._emitMessage) {
          this.emit("message", msg);
        }
        this.emit(eventName, msg);
      });
    }
    requestSsl() {
      this.stream.write(serialize.requestSsl());
    }
    startup(config) {
      this.stream.write(serialize.startup(config));
    }
    cancel(processID, secretKey) {
      this._send(serialize.cancel(processID, secretKey));
    }
    password(password) {
      this._send(serialize.password(password));
    }
    sendSASLInitialResponseMessage(mechanism, initialResponse) {
      this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
    }
    sendSCRAMClientFinalMessage(additionalData) {
      this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
    }
    _send(buffer) {
      if (!this.stream.writable) {
        return false;
      }
      return this.stream.write(buffer);
    }
    query(text) {
      this._send(serialize.query(text));
    }
    parse(query) {
      this._send(serialize.parse(query));
    }
    bind(config) {
      this._send(serialize.bind(config));
    }
    execute(config) {
      this._send(serialize.execute(config));
    }
    flush() {
      if (this.stream.writable) {
        this.stream.write(flushBuffer);
      }
    }
    sync() {
      this._ending = true;
      this._send(syncBuffer);
    }
    ref() {
      this.stream.ref();
    }
    unref() {
      this.stream.unref();
    }
    end() {
      this._ending = true;
      if (!this._connecting || !this.stream.writable) {
        this.stream.end();
        return;
      }
      return this.stream.write(endBuffer, () => {
        this.stream.end();
      });
    }
    close(msg) {
      this._send(serialize.close(msg));
    }
    describe(msg) {
      this._send(serialize.describe(msg));
    }
    sendCopyFromChunk(chunk) {
      this._send(serialize.copyData(chunk));
    }
    endCopyFrom() {
      this._send(serialize.copyDone());
    }
    sendCopyFail(msg) {
      this._send(serialize.copyFail(msg));
    }
  }
  module.exports = Connection;
});

// node_modules/split2/index.js
var require_split2 = __commonJS((exports, module) => {
  var { Transform } = __require("stream");
  var { StringDecoder } = __require("string_decoder");
  var kLast = Symbol("last");
  var kDecoder = Symbol("decoder");
  function transform(chunk, enc, cb) {
    let list;
    if (this.overflow) {
      const buf = this[kDecoder].write(chunk);
      list = buf.split(this.matcher);
      if (list.length === 1)
        return cb();
      list.shift();
      this.overflow = false;
    } else {
      this[kLast] += this[kDecoder].write(chunk);
      list = this[kLast].split(this.matcher);
    }
    this[kLast] = list.pop();
    for (let i = 0;i < list.length; i++) {
      try {
        push(this, this.mapper(list[i]));
      } catch (error) {
        return cb(error);
      }
    }
    this.overflow = this[kLast].length > this.maxLength;
    if (this.overflow && !this.skipOverflow) {
      cb(new Error("maximum buffer reached"));
      return;
    }
    cb();
  }
  function flush(cb) {
    this[kLast] += this[kDecoder].end();
    if (this[kLast]) {
      try {
        push(this, this.mapper(this[kLast]));
      } catch (error) {
        return cb(error);
      }
    }
    cb();
  }
  function push(self, val) {
    if (val !== undefined) {
      self.push(val);
    }
  }
  function noop(incoming) {
    return incoming;
  }
  function split(matcher, mapper, options) {
    matcher = matcher || /\r?\n/;
    mapper = mapper || noop;
    options = options || {};
    switch (arguments.length) {
      case 1:
        if (typeof matcher === "function") {
          mapper = matcher;
          matcher = /\r?\n/;
        } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
          options = matcher;
          matcher = /\r?\n/;
        }
        break;
      case 2:
        if (typeof matcher === "function") {
          options = mapper;
          mapper = matcher;
          matcher = /\r?\n/;
        } else if (typeof mapper === "object") {
          options = mapper;
          mapper = noop;
        }
    }
    options = Object.assign({}, options);
    options.autoDestroy = true;
    options.transform = transform;
    options.flush = flush;
    options.readableObjectMode = true;
    const stream = new Transform(options);
    stream[kLast] = "";
    stream[kDecoder] = new StringDecoder("utf8");
    stream.matcher = matcher;
    stream.mapper = mapper;
    stream.maxLength = options.maxLength;
    stream.skipOverflow = options.skipOverflow || false;
    stream.overflow = false;
    stream._destroy = function(err, cb) {
      this._writableState.errorEmitted = false;
      cb(err);
    };
    return stream;
  }
  module.exports = split;
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS((exports, module) => {
  var path = __require("path");
  var Stream = __require("stream").Stream;
  var split = require_split2();
  var util = __require("util");
  var defaultPort = 5432;
  var isWin = process.platform === "win32";
  var warnStream = process.stderr;
  var S_IRWXG = 56;
  var S_IRWXO = 7;
  var S_IFMT = 61440;
  var S_IFREG = 32768;
  function isRegFile(mode) {
    return (mode & S_IFMT) == S_IFREG;
  }
  var fieldNames = ["host", "port", "database", "user", "password"];
  var nrOfFields = fieldNames.length;
  var passKey = fieldNames[nrOfFields - 1];
  function warn() {
    var isWritable = warnStream instanceof Stream && warnStream.writable === true;
    if (isWritable) {
      var args = Array.prototype.slice.call(arguments).concat(`
`);
      warnStream.write(util.format.apply(util, args));
    }
  }
  Object.defineProperty(exports, "isWin", {
    get: function() {
      return isWin;
    },
    set: function(val) {
      isWin = val;
    }
  });
  exports.warnTo = function(stream) {
    var old = warnStream;
    warnStream = stream;
    return old;
  };
  exports.getFileName = function(rawEnv) {
    var env = rawEnv || process.env;
    var file = env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
    return file;
  };
  exports.usePgPass = function(stats, fname) {
    if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
      return false;
    }
    if (isWin) {
      return true;
    }
    fname = fname || "<unkn>";
    if (!isRegFile(stats.mode)) {
      warn('WARNING: password file "%s" is not a plain file', fname);
      return false;
    }
    if (stats.mode & (S_IRWXG | S_IRWXO)) {
      warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
      return false;
    }
    return true;
  };
  var matcher = exports.match = function(connInfo, entry) {
    return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
      if (idx == 1) {
        if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
          return prev && true;
        }
      }
      return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
    }, true);
  };
  exports.getPassword = function(connInfo, stream, cb) {
    var pass;
    var lineStream = stream.pipe(split());
    function onLine(line) {
      var entry = parseLine(line);
      if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
        pass = entry[passKey];
        lineStream.end();
      }
    }
    var onEnd = function() {
      stream.destroy();
      cb(pass);
    };
    var onErr = function(err) {
      stream.destroy();
      warn("WARNING: error on reading file: %s", err);
      cb(undefined);
    };
    stream.on("error", onErr);
    lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
  };
  var parseLine = exports.parseLine = function(line) {
    if (line.length < 11 || line.match(/^\s+#/)) {
      return null;
    }
    var curChar = "";
    var prevChar = "";
    var fieldIdx = 0;
    var startIdx = 0;
    var endIdx = 0;
    var obj = {};
    var isLastField = false;
    var addToObj = function(idx, i0, i1) {
      var field = line.substring(i0, i1);
      if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
        field = field.replace(/\\([:\\])/g, "$1");
      }
      obj[fieldNames[idx]] = field;
    };
    for (var i = 0;i < line.length - 1; i += 1) {
      curChar = line.charAt(i + 1);
      prevChar = line.charAt(i);
      isLastField = fieldIdx == nrOfFields - 1;
      if (isLastField) {
        addToObj(fieldIdx, startIdx);
        break;
      }
      if (i >= 0 && curChar == ":" && prevChar !== "\\") {
        addToObj(fieldIdx, startIdx, i + 1);
        startIdx = i + 2;
        fieldIdx += 1;
      }
    }
    obj = Object.keys(obj).length === nrOfFields ? obj : null;
    return obj;
  };
  var isValidEntry = exports.isValidEntry = function(entry) {
    var rules = {
      0: function(x) {
        return x.length > 0;
      },
      1: function(x) {
        if (x === "*") {
          return true;
        }
        x = Number(x);
        return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
      },
      2: function(x) {
        return x.length > 0;
      },
      3: function(x) {
        return x.length > 0;
      },
      4: function(x) {
        return x.length > 0;
      }
    };
    for (var idx = 0;idx < fieldNames.length; idx += 1) {
      var rule = rules[idx];
      var value = entry[fieldNames[idx]] || "";
      var res = rule(value);
      if (!res) {
        return false;
      }
    }
    return true;
  };
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS((exports, module) => {
  var path = __require("path");
  var fs = __require("fs");
  var helper = require_helper();
  module.exports = function(connInfo, cb) {
    var file = helper.getFileName();
    fs.stat(file, function(err, stat) {
      if (err || !helper.usePgPass(stat, file)) {
        return cb(undefined);
      }
      var st = fs.createReadStream(file);
      helper.getPassword(connInfo, st, cb);
    });
  };
  module.exports.warnTo = helper.warnTo;
});

// node_modules/pg/lib/client.js
var require_client = __commonJS((exports, module) => {
  var EventEmitter = __require("events").EventEmitter;
  var utils = require_utils();
  var sasl = require_sasl();
  var TypeOverrides = require_type_overrides();
  var ConnectionParameters = require_connection_parameters();
  var Query = require_query();
  var defaults = require_defaults();
  var Connection = require_connection();
  var crypto = require_utils2();

  class Client extends EventEmitter {
    constructor(config) {
      super();
      this.connectionParameters = new ConnectionParameters(config);
      this.user = this.connectionParameters.user;
      this.database = this.connectionParameters.database;
      this.port = this.connectionParameters.port;
      this.host = this.connectionParameters.host;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: this.connectionParameters.password
      });
      this.replication = this.connectionParameters.replication;
      const c = config || {};
      this._Promise = c.Promise || global.Promise;
      this._types = new TypeOverrides(c.types);
      this._ending = false;
      this._ended = false;
      this._connecting = false;
      this._connected = false;
      this._connectionError = false;
      this._queryable = true;
      this.enableChannelBinding = Boolean(c.enableChannelBinding);
      this.connection = c.connection || new Connection({
        stream: c.stream,
        ssl: this.connectionParameters.ssl,
        keepAlive: c.keepAlive || false,
        keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
        encoding: this.connectionParameters.client_encoding || "utf8"
      });
      this.queryQueue = [];
      this.binary = c.binary || defaults.binary;
      this.processID = null;
      this.secretKey = null;
      this.ssl = this.connectionParameters.ssl || false;
      if (this.ssl && this.ssl.key) {
        Object.defineProperty(this.ssl, "key", {
          enumerable: false
        });
      }
      this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
    }
    _errorAllQueries(err) {
      const enqueueError = (query) => {
        process.nextTick(() => {
          query.handleError(err, this.connection);
        });
      };
      if (this.activeQuery) {
        enqueueError(this.activeQuery);
        this.activeQuery = null;
      }
      this.queryQueue.forEach(enqueueError);
      this.queryQueue.length = 0;
    }
    _connect(callback) {
      const self = this;
      const con = this.connection;
      this._connectionCallback = callback;
      if (this._connecting || this._connected) {
        const err = new Error("Client has already been connected. You cannot reuse a client.");
        process.nextTick(() => {
          callback(err);
        });
        return;
      }
      this._connecting = true;
      if (this._connectionTimeoutMillis > 0) {
        this.connectionTimeoutHandle = setTimeout(() => {
          con._ending = true;
          con.stream.destroy(new Error("timeout expired"));
        }, this._connectionTimeoutMillis);
        if (this.connectionTimeoutHandle.unref) {
          this.connectionTimeoutHandle.unref();
        }
      }
      if (this.host && this.host.indexOf("/") === 0) {
        con.connect(this.host + "/.s.PGSQL." + this.port);
      } else {
        con.connect(this.port, this.host);
      }
      con.on("connect", function() {
        if (self.ssl) {
          con.requestSsl();
        } else {
          con.startup(self.getStartupConf());
        }
      });
      con.on("sslconnect", function() {
        con.startup(self.getStartupConf());
      });
      this._attachListeners(con);
      con.once("end", () => {
        const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
        clearTimeout(this.connectionTimeoutHandle);
        this._errorAllQueries(error);
        this._ended = true;
        if (!this._ending) {
          if (this._connecting && !this._connectionError) {
            if (this._connectionCallback) {
              this._connectionCallback(error);
            } else {
              this._handleErrorEvent(error);
            }
          } else if (!this._connectionError) {
            this._handleErrorEvent(error);
          }
        }
        process.nextTick(() => {
          this.emit("end");
        });
      });
    }
    connect(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
    _attachListeners(con) {
      con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
      con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
      con.on("authenticationSASL", this._handleAuthSASL.bind(this));
      con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
      con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
      con.on("backendKeyData", this._handleBackendKeyData.bind(this));
      con.on("error", this._handleErrorEvent.bind(this));
      con.on("errorMessage", this._handleErrorMessage.bind(this));
      con.on("readyForQuery", this._handleReadyForQuery.bind(this));
      con.on("notice", this._handleNotice.bind(this));
      con.on("rowDescription", this._handleRowDescription.bind(this));
      con.on("dataRow", this._handleDataRow.bind(this));
      con.on("portalSuspended", this._handlePortalSuspended.bind(this));
      con.on("emptyQuery", this._handleEmptyQuery.bind(this));
      con.on("commandComplete", this._handleCommandComplete.bind(this));
      con.on("parseComplete", this._handleParseComplete.bind(this));
      con.on("copyInResponse", this._handleCopyInResponse.bind(this));
      con.on("copyData", this._handleCopyData.bind(this));
      con.on("notification", this._handleNotification.bind(this));
    }
    _checkPgPass(cb) {
      const con = this.connection;
      if (typeof this.password === "function") {
        this._Promise.resolve().then(() => this.password()).then((pass) => {
          if (pass !== undefined) {
            if (typeof pass !== "string") {
              con.emit("error", new TypeError("Password must be a string"));
              return;
            }
            this.connectionParameters.password = this.password = pass;
          } else {
            this.connectionParameters.password = this.password = null;
          }
          cb();
        }).catch((err) => {
          con.emit("error", err);
        });
      } else if (this.password !== null) {
        cb();
      } else {
        try {
          const pgPass = require_lib();
          pgPass(this.connectionParameters, (pass) => {
            if (pass !== undefined) {
              this.connectionParameters.password = this.password = pass;
            }
            cb();
          });
        } catch (e) {
          this.emit("error", e);
        }
      }
    }
    _handleAuthCleartextPassword(msg) {
      this._checkPgPass(() => {
        this.connection.password(this.password);
      });
    }
    _handleAuthMD5Password(msg) {
      this._checkPgPass(async () => {
        try {
          const hashedPassword = await crypto.postgresMd5PasswordHash(this.user, this.password, msg.salt);
          this.connection.password(hashedPassword);
        } catch (e) {
          this.emit("error", e);
        }
      });
    }
    _handleAuthSASL(msg) {
      this._checkPgPass(() => {
        try {
          this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream);
          this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      });
    }
    async _handleAuthSASLContinue(msg) {
      try {
        await sasl.continueSession(this.saslSession, this.password, msg.data, this.enableChannelBinding && this.connection.stream);
        this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
      } catch (err) {
        this.connection.emit("error", err);
      }
    }
    _handleAuthSASLFinal(msg) {
      try {
        sasl.finalizeSession(this.saslSession, msg.data);
        this.saslSession = null;
      } catch (err) {
        this.connection.emit("error", err);
      }
    }
    _handleBackendKeyData(msg) {
      this.processID = msg.processID;
      this.secretKey = msg.secretKey;
    }
    _handleReadyForQuery(msg) {
      if (this._connecting) {
        this._connecting = false;
        this._connected = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          this._connectionCallback(null, this);
          this._connectionCallback = null;
        }
        this.emit("connect");
      }
      const { activeQuery } = this;
      this.activeQuery = null;
      this.readyForQuery = true;
      if (activeQuery) {
        activeQuery.handleReadyForQuery(this.connection);
      }
      this._pulseQueryQueue();
    }
    _handleErrorWhileConnecting(err) {
      if (this._connectionError) {
        return;
      }
      this._connectionError = true;
      clearTimeout(this.connectionTimeoutHandle);
      if (this._connectionCallback) {
        return this._connectionCallback(err);
      }
      this.emit("error", err);
    }
    _handleErrorEvent(err) {
      if (this._connecting) {
        return this._handleErrorWhileConnecting(err);
      }
      this._queryable = false;
      this._errorAllQueries(err);
      this.emit("error", err);
    }
    _handleErrorMessage(msg) {
      if (this._connecting) {
        return this._handleErrorWhileConnecting(msg);
      }
      const activeQuery = this.activeQuery;
      if (!activeQuery) {
        this._handleErrorEvent(msg);
        return;
      }
      this.activeQuery = null;
      activeQuery.handleError(msg, this.connection);
    }
    _handleRowDescription(msg) {
      this.activeQuery.handleRowDescription(msg);
    }
    _handleDataRow(msg) {
      this.activeQuery.handleDataRow(msg);
    }
    _handlePortalSuspended(msg) {
      this.activeQuery.handlePortalSuspended(this.connection);
    }
    _handleEmptyQuery(msg) {
      this.activeQuery.handleEmptyQuery(this.connection);
    }
    _handleCommandComplete(msg) {
      if (this.activeQuery == null) {
        const error = new Error("Received unexpected commandComplete message from backend.");
        this._handleErrorEvent(error);
        return;
      }
      this.activeQuery.handleCommandComplete(msg, this.connection);
    }
    _handleParseComplete() {
      if (this.activeQuery == null) {
        const error = new Error("Received unexpected parseComplete message from backend.");
        this._handleErrorEvent(error);
        return;
      }
      if (this.activeQuery.name) {
        this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text;
      }
    }
    _handleCopyInResponse(msg) {
      this.activeQuery.handleCopyInResponse(this.connection);
    }
    _handleCopyData(msg) {
      this.activeQuery.handleCopyData(msg, this.connection);
    }
    _handleNotification(msg) {
      this.emit("notification", msg);
    }
    _handleNotice(msg) {
      this.emit("notice", msg);
    }
    getStartupConf() {
      const params = this.connectionParameters;
      const data = {
        user: params.user,
        database: params.database
      };
      const appName = params.application_name || params.fallback_application_name;
      if (appName) {
        data.application_name = appName;
      }
      if (params.replication) {
        data.replication = "" + params.replication;
      }
      if (params.statement_timeout) {
        data.statement_timeout = String(parseInt(params.statement_timeout, 10));
      }
      if (params.lock_timeout) {
        data.lock_timeout = String(parseInt(params.lock_timeout, 10));
      }
      if (params.idle_in_transaction_session_timeout) {
        data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
      }
      if (params.options) {
        data.options = params.options;
      }
      return data;
    }
    cancel(client, query) {
      if (client.activeQuery === query) {
        const con = this.connection;
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          con.cancel(client.processID, client.secretKey);
        });
      } else if (client.queryQueue.indexOf(query) !== -1) {
        client.queryQueue.splice(client.queryQueue.indexOf(query), 1);
      }
    }
    setTypeParser(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    }
    getTypeParser(oid, format) {
      return this._types.getTypeParser(oid, format);
    }
    escapeIdentifier(str) {
      return utils.escapeIdentifier(str);
    }
    escapeLiteral(str) {
      return utils.escapeLiteral(str);
    }
    _pulseQueryQueue() {
      if (this.readyForQuery === true) {
        this.activeQuery = this.queryQueue.shift();
        if (this.activeQuery) {
          this.readyForQuery = false;
          this.hasExecuted = true;
          const queryError = this.activeQuery.submit(this.connection);
          if (queryError) {
            process.nextTick(() => {
              this.activeQuery.handleError(queryError, this.connection);
              this.readyForQuery = true;
              this._pulseQueryQueue();
            });
          }
        } else if (this.hasExecuted) {
          this.activeQuery = null;
          this.emit("drain");
        }
      }
    }
    query(config, values, callback) {
      let query;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config === null || config === undefined) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config.submit === "function") {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        result = query = config;
        if (typeof values === "function") {
          query.callback = query.callback || values;
        }
      } else {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        query = new Query(config, values, callback);
        if (!query.callback) {
          result = new this._Promise((resolve, reject) => {
            query.callback = (err, res) => err ? reject(err) : resolve(res);
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
        }
      }
      if (readTimeout) {
        queryCallback = query.callback;
        readTimeoutTimer = setTimeout(() => {
          const error = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error, this.connection);
          });
          queryCallback(error);
          query.callback = () => {};
          const index = this.queryQueue.indexOf(query);
          if (index > -1) {
            this.queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (this.binary && !query.binary) {
        query.binary = true;
      }
      if (query._result && !query._result._types) {
        query._result._types = this._types;
      }
      if (!this._queryable) {
        process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
        });
        return result;
      }
      if (this._ending) {
        process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"), this.connection);
        });
        return result;
      }
      this.queryQueue.push(query);
      this._pulseQueryQueue();
      return result;
    }
    ref() {
      this.connection.ref();
    }
    unref() {
      this.connection.unref();
    }
    end(cb) {
      this._ending = true;
      if (!this.connection._connecting || this._ended) {
        if (cb) {
          cb();
        } else {
          return this._Promise.resolve();
        }
      }
      if (this.activeQuery || !this._queryable) {
        this.connection.stream.destroy();
      } else {
        this.connection.end();
      }
      if (cb) {
        this.connection.once("end", cb);
      } else {
        return new this._Promise((resolve) => {
          this.connection.once("end", resolve);
        });
      }
    }
  }
  Client.Query = Query;
  module.exports = Client;
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS((exports, module) => {
  var EventEmitter = __require("events").EventEmitter;
  var NOOP = function() {};
  var removeWhere = (list, predicate) => {
    const i = list.findIndex(predicate);
    return i === -1 ? undefined : list.splice(i, 1)[0];
  };

  class IdleItem {
    constructor(client, idleListener, timeoutId) {
      this.client = client;
      this.idleListener = idleListener;
      this.timeoutId = timeoutId;
    }
  }

  class PendingItem {
    constructor(callback) {
      this.callback = callback;
    }
  }
  function throwOnDoubleRelease() {
    throw new Error("Release called on client which has already been released to the pool.");
  }
  function promisify(Promise2, callback) {
    if (callback) {
      return { callback, result: undefined };
    }
    let rej;
    let res;
    const cb = function(err, client) {
      err ? rej(err) : res(client);
    };
    const result = new Promise2(function(resolve, reject) {
      res = resolve;
      rej = reject;
    }).catch((err) => {
      Error.captureStackTrace(err);
      throw err;
    });
    return { callback: cb, result };
  }
  function makeIdleListener(pool, client) {
    return function idleListener(err) {
      err.client = client;
      client.removeListener("error", idleListener);
      client.on("error", () => {
        pool.log("additional client error after disconnection due to error", err);
      });
      pool._remove(client);
      pool.emit("error", err, client);
    };
  }

  class Pool extends EventEmitter {
    constructor(options, Client) {
      super();
      this.options = Object.assign({}, options);
      if (options != null && "password" in options) {
        Object.defineProperty(this.options, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: options.password
        });
      }
      if (options != null && options.ssl && options.ssl.key) {
        Object.defineProperty(this.options.ssl, "key", {
          enumerable: false
        });
      }
      this.options.max = this.options.max || this.options.poolSize || 10;
      this.options.min = this.options.min || 0;
      this.options.maxUses = this.options.maxUses || Infinity;
      this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
      this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
      this.log = this.options.log || function() {};
      this.Client = this.options.Client || Client || require_lib2().Client;
      this.Promise = this.options.Promise || global.Promise;
      if (typeof this.options.idleTimeoutMillis === "undefined") {
        this.options.idleTimeoutMillis = 1e4;
      }
      this._clients = [];
      this._idle = [];
      this._expired = new WeakSet;
      this._pendingQueue = [];
      this._endCallback = undefined;
      this.ending = false;
      this.ended = false;
    }
    _isFull() {
      return this._clients.length >= this.options.max;
    }
    _isAboveMin() {
      return this._clients.length > this.options.min;
    }
    _pulseQueue() {
      this.log("pulse queue");
      if (this.ended) {
        this.log("pulse queue ended");
        return;
      }
      if (this.ending) {
        this.log("pulse queue on ending");
        if (this._idle.length) {
          this._idle.slice().map((item) => {
            this._remove(item.client);
          });
        }
        if (!this._clients.length) {
          this.ended = true;
          this._endCallback();
        }
        return;
      }
      if (!this._pendingQueue.length) {
        this.log("no queued requests");
        return;
      }
      if (!this._idle.length && this._isFull()) {
        return;
      }
      const pendingItem = this._pendingQueue.shift();
      if (this._idle.length) {
        const idleItem = this._idle.pop();
        clearTimeout(idleItem.timeoutId);
        const client = idleItem.client;
        client.ref && client.ref();
        const idleListener = idleItem.idleListener;
        return this._acquireClient(client, pendingItem, idleListener, false);
      }
      if (!this._isFull()) {
        return this.newClient(pendingItem);
      }
      throw new Error("unexpected condition");
    }
    _remove(client, callback) {
      const removed = removeWhere(this._idle, (item) => item.client === client);
      if (removed !== undefined) {
        clearTimeout(removed.timeoutId);
      }
      this._clients = this._clients.filter((c) => c !== client);
      const context = this;
      client.end(() => {
        context.emit("remove", client);
        if (typeof callback === "function") {
          callback();
        }
      });
    }
    connect(cb) {
      if (this.ending) {
        const err = new Error("Cannot use a pool after calling end on the pool");
        return cb ? cb(err) : this.Promise.reject(err);
      }
      const response = promisify(this.Promise, cb);
      const result = response.result;
      if (this._isFull() || this._idle.length) {
        if (this._idle.length) {
          process.nextTick(() => this._pulseQueue());
        }
        if (!this.options.connectionTimeoutMillis) {
          this._pendingQueue.push(new PendingItem(response.callback));
          return result;
        }
        const queueCallback = (err, res, done) => {
          clearTimeout(tid);
          response.callback(err, res, done);
        };
        const pendingItem = new PendingItem(queueCallback);
        const tid = setTimeout(() => {
          removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
          pendingItem.timedOut = true;
          response.callback(new Error("timeout exceeded when trying to connect"));
        }, this.options.connectionTimeoutMillis);
        if (tid.unref) {
          tid.unref();
        }
        this._pendingQueue.push(pendingItem);
        return result;
      }
      this.newClient(new PendingItem(response.callback));
      return result;
    }
    newClient(pendingItem) {
      const client = new this.Client(this.options);
      this._clients.push(client);
      const idleListener = makeIdleListener(this, client);
      this.log("checking client timeout");
      let tid;
      let timeoutHit = false;
      if (this.options.connectionTimeoutMillis) {
        tid = setTimeout(() => {
          this.log("ending client due to timeout");
          timeoutHit = true;
          client.connection ? client.connection.stream.destroy() : client.end();
        }, this.options.connectionTimeoutMillis);
      }
      this.log("connecting new client");
      client.connect((err) => {
        if (tid) {
          clearTimeout(tid);
        }
        client.on("error", idleListener);
        if (err) {
          this.log("client failed to connect", err);
          this._clients = this._clients.filter((c) => c !== client);
          if (timeoutHit) {
            err = new Error("Connection terminated due to connection timeout", { cause: err });
          }
          this._pulseQueue();
          if (!pendingItem.timedOut) {
            pendingItem.callback(err, undefined, NOOP);
          }
        } else {
          this.log("new client connected");
          if (this.options.maxLifetimeSeconds !== 0) {
            const maxLifetimeTimeout = setTimeout(() => {
              this.log("ending client due to expired lifetime");
              this._expired.add(client);
              const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
              if (idleIndex !== -1) {
                this._acquireClient(client, new PendingItem((err2, client2, clientRelease) => clientRelease()), idleListener, false);
              }
            }, this.options.maxLifetimeSeconds * 1000);
            maxLifetimeTimeout.unref();
            client.once("end", () => clearTimeout(maxLifetimeTimeout));
          }
          return this._acquireClient(client, pendingItem, idleListener, true);
        }
      });
    }
    _acquireClient(client, pendingItem, idleListener, isNew) {
      if (isNew) {
        this.emit("connect", client);
      }
      this.emit("acquire", client);
      client.release = this._releaseOnce(client, idleListener);
      client.removeListener("error", idleListener);
      if (!pendingItem.timedOut) {
        if (isNew && this.options.verify) {
          this.options.verify(client, (err) => {
            if (err) {
              client.release(err);
              return pendingItem.callback(err, undefined, NOOP);
            }
            pendingItem.callback(undefined, client, client.release);
          });
        } else {
          pendingItem.callback(undefined, client, client.release);
        }
      } else {
        if (isNew && this.options.verify) {
          this.options.verify(client, client.release);
        } else {
          client.release();
        }
      }
    }
    _releaseOnce(client, idleListener) {
      let released = false;
      return (err) => {
        if (released) {
          throwOnDoubleRelease();
        }
        released = true;
        this._release(client, idleListener, err);
      };
    }
    _release(client, idleListener, err) {
      client.on("error", idleListener);
      client._poolUseCount = (client._poolUseCount || 0) + 1;
      this.emit("release", err, client);
      if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
        if (client._poolUseCount >= this.options.maxUses) {
          this.log("remove expended client");
        }
        return this._remove(client, this._pulseQueue.bind(this));
      }
      const isExpired = this._expired.has(client);
      if (isExpired) {
        this.log("remove expired client");
        this._expired.delete(client);
        return this._remove(client, this._pulseQueue.bind(this));
      }
      let tid;
      if (this.options.idleTimeoutMillis && this._isAboveMin()) {
        tid = setTimeout(() => {
          this.log("remove idle client");
          this._remove(client, this._pulseQueue.bind(this));
        }, this.options.idleTimeoutMillis);
        if (this.options.allowExitOnIdle) {
          tid.unref();
        }
      }
      if (this.options.allowExitOnIdle) {
        client.unref();
      }
      this._idle.push(new IdleItem(client, idleListener, tid));
      this._pulseQueue();
    }
    query(text, values, cb) {
      if (typeof text === "function") {
        const response2 = promisify(this.Promise, text);
        setImmediate(function() {
          return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
        });
        return response2.result;
      }
      if (typeof values === "function") {
        cb = values;
        values = undefined;
      }
      const response = promisify(this.Promise, cb);
      cb = response.callback;
      this.connect((err, client) => {
        if (err) {
          return cb(err);
        }
        let clientReleased = false;
        const onError = (err2) => {
          if (clientReleased) {
            return;
          }
          clientReleased = true;
          client.release(err2);
          cb(err2);
        };
        client.once("error", onError);
        this.log("dispatching query");
        try {
          client.query(text, values, (err2, res) => {
            this.log("query dispatched");
            client.removeListener("error", onError);
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            if (err2) {
              return cb(err2);
            }
            return cb(undefined, res);
          });
        } catch (err2) {
          client.release(err2);
          return cb(err2);
        }
      });
      return response.result;
    }
    end(cb) {
      this.log("ending");
      if (this.ending) {
        const err = new Error("Called end on pool more than once");
        return cb ? cb(err) : this.Promise.reject(err);
      }
      this.ending = true;
      const promised = promisify(this.Promise, cb);
      this._endCallback = promised.callback;
      this._pulseQueue();
      return promised.result;
    }
    get waitingCount() {
      return this._pendingQueue.length;
    }
    get idleCount() {
      return this._idle.length;
    }
    get expiredCount() {
      return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
    }
    get totalCount() {
      return this._clients.length;
    }
  }
  module.exports = Pool;
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS((exports, module) => {
  var EventEmitter = __require("events").EventEmitter;
  var util = __require("util");
  var utils = require_utils();
  var NativeQuery = module.exports = function(config, values, callback) {
    EventEmitter.call(this);
    config = utils.normalizeQueryConfig(config, values, callback);
    this.text = config.text;
    this.values = config.values;
    this.name = config.name;
    this.queryMode = config.queryMode;
    this.callback = config.callback;
    this.state = "new";
    this._arrayMode = config.rowMode === "array";
    this._emitRowEvents = false;
    this.on("newListener", function(event) {
      if (event === "row")
        this._emitRowEvents = true;
    }.bind(this));
  };
  util.inherits(NativeQuery, EventEmitter);
  var errorFieldMap = {
    sqlState: "code",
    statementPosition: "position",
    messagePrimary: "message",
    context: "where",
    schemaName: "schema",
    tableName: "table",
    columnName: "column",
    dataTypeName: "dataType",
    constraintName: "constraint",
    sourceFile: "file",
    sourceLine: "line",
    sourceFunction: "routine"
  };
  NativeQuery.prototype.handleError = function(err) {
    const fields = this.native.pq.resultErrorFields();
    if (fields) {
      for (const key in fields) {
        const normalizedFieldName = errorFieldMap[key] || key;
        err[normalizedFieldName] = fields[key];
      }
    }
    if (this.callback) {
      this.callback(err);
    } else {
      this.emit("error", err);
    }
    this.state = "error";
  };
  NativeQuery.prototype.then = function(onSuccess, onFailure) {
    return this._getPromise().then(onSuccess, onFailure);
  };
  NativeQuery.prototype.catch = function(callback) {
    return this._getPromise().catch(callback);
  };
  NativeQuery.prototype._getPromise = function() {
    if (this._promise)
      return this._promise;
    this._promise = new Promise(function(resolve, reject) {
      this._once("end", resolve);
      this._once("error", reject);
    }.bind(this));
    return this._promise;
  };
  NativeQuery.prototype.submit = function(client) {
    this.state = "running";
    const self = this;
    this.native = client.native;
    client.native.arrayMode = this._arrayMode;
    let after = function(err, rows, results) {
      client.native.arrayMode = false;
      setImmediate(function() {
        self.emit("_done");
      });
      if (err) {
        return self.handleError(err);
      }
      if (self._emitRowEvents) {
        if (results.length > 1) {
          rows.forEach((rowOfRows, i) => {
            rowOfRows.forEach((row) => {
              self.emit("row", row, results[i]);
            });
          });
        } else {
          rows.forEach(function(row) {
            self.emit("row", row, results);
          });
        }
      }
      self.state = "end";
      self.emit("end", results);
      if (self.callback) {
        self.callback(null, results);
      }
    };
    if (process.domain) {
      after = process.domain.bind(after);
    }
    if (this.name) {
      if (this.name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", this.name, this.name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const values = (this.values || []).map(utils.prepareValue);
      if (client.namedQueries[this.name]) {
        if (this.text && client.namedQueries[this.name] !== this.text) {
          const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
          return after(err);
        }
        return client.native.execute(this.name, values, after);
      }
      return client.native.prepare(this.name, this.text, values.length, function(err) {
        if (err)
          return after(err);
        client.namedQueries[self.name] = self.text;
        return self.native.execute(self.name, values, after);
      });
    } else if (this.values) {
      if (!Array.isArray(this.values)) {
        const err = new Error("Query values must be an array");
        return after(err);
      }
      const vals = this.values.map(utils.prepareValue);
      client.native.query(this.text, vals, after);
    } else if (this.queryMode === "extended") {
      client.native.query(this.text, [], after);
    } else {
      client.native.query(this.text, after);
    }
  };
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS((exports, module) => {
  var Native;
  try {
    Native = (()=>{throw new Error("Cannot require module "+"pg-native");})();
  } catch (e) {
    throw e;
  }
  var TypeOverrides = require_type_overrides();
  var EventEmitter = __require("events").EventEmitter;
  var util = __require("util");
  var ConnectionParameters = require_connection_parameters();
  var NativeQuery = require_query2();
  var Client = module.exports = function(config) {
    EventEmitter.call(this);
    config = config || {};
    this._Promise = config.Promise || global.Promise;
    this._types = new TypeOverrides(config.types);
    this.native = new Native({
      types: this._types
    });
    this._queryQueue = [];
    this._ending = false;
    this._connecting = false;
    this._connected = false;
    this._queryable = true;
    const cp = this.connectionParameters = new ConnectionParameters(config);
    if (config.nativeConnectionString)
      cp.nativeConnectionString = config.nativeConnectionString;
    this.user = cp.user;
    Object.defineProperty(this, "password", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: cp.password
    });
    this.database = cp.database;
    this.host = cp.host;
    this.port = cp.port;
    this.namedQueries = {};
  };
  Client.Query = NativeQuery;
  util.inherits(Client, EventEmitter);
  Client.prototype._errorAllQueries = function(err) {
    const enqueueError = (query) => {
      process.nextTick(() => {
        query.native = this.native;
        query.handleError(err);
      });
    };
    if (this._hasActiveQuery()) {
      enqueueError(this._activeQuery);
      this._activeQuery = null;
    }
    this._queryQueue.forEach(enqueueError);
    this._queryQueue.length = 0;
  };
  Client.prototype._connect = function(cb) {
    const self = this;
    if (this._connecting) {
      process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
      return;
    }
    this._connecting = true;
    this.connectionParameters.getLibpqConnectionString(function(err, conString) {
      if (self.connectionParameters.nativeConnectionString)
        conString = self.connectionParameters.nativeConnectionString;
      if (err)
        return cb(err);
      self.native.connect(conString, function(err2) {
        if (err2) {
          self.native.end();
          return cb(err2);
        }
        self._connected = true;
        self.native.on("error", function(err3) {
          self._queryable = false;
          self._errorAllQueries(err3);
          self.emit("error", err3);
        });
        self.native.on("notification", function(msg) {
          self.emit("notification", {
            channel: msg.relname,
            payload: msg.extra
          });
        });
        self.emit("connect");
        self._pulseQueryQueue(true);
        cb();
      });
    });
  };
  Client.prototype.connect = function(callback) {
    if (callback) {
      this._connect(callback);
      return;
    }
    return new this._Promise((resolve, reject) => {
      this._connect((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
  Client.prototype.query = function(config, values, callback) {
    let query;
    let result;
    let readTimeout;
    let readTimeoutTimer;
    let queryCallback;
    if (config === null || config === undefined) {
      throw new TypeError("Client was passed a null or undefined query");
    } else if (typeof config.submit === "function") {
      readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
      result = query = config;
      if (typeof values === "function") {
        config.callback = values;
      }
    } else {
      readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
      query = new NativeQuery(config, values, callback);
      if (!query.callback) {
        let resolveOut, rejectOut;
        result = new this._Promise((resolve, reject) => {
          resolveOut = resolve;
          rejectOut = reject;
        }).catch((err) => {
          Error.captureStackTrace(err);
          throw err;
        });
        query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
      }
    }
    if (readTimeout) {
      queryCallback = query.callback;
      readTimeoutTimer = setTimeout(() => {
        const error = new Error("Query read timeout");
        process.nextTick(() => {
          query.handleError(error, this.connection);
        });
        queryCallback(error);
        query.callback = () => {};
        const index = this._queryQueue.indexOf(query);
        if (index > -1) {
          this._queryQueue.splice(index, 1);
        }
        this._pulseQueryQueue();
      }, readTimeout);
      query.callback = (err, res) => {
        clearTimeout(readTimeoutTimer);
        queryCallback(err, res);
      };
    }
    if (!this._queryable) {
      query.native = this.native;
      process.nextTick(() => {
        query.handleError(new Error("Client has encountered a connection error and is not queryable"));
      });
      return result;
    }
    if (this._ending) {
      query.native = this.native;
      process.nextTick(() => {
        query.handleError(new Error("Client was closed and is not queryable"));
      });
      return result;
    }
    this._queryQueue.push(query);
    this._pulseQueryQueue();
    return result;
  };
  Client.prototype.end = function(cb) {
    const self = this;
    this._ending = true;
    if (!this._connected) {
      this.once("connect", this.end.bind(this, cb));
    }
    let result;
    if (!cb) {
      result = new this._Promise(function(resolve, reject) {
        cb = (err) => err ? reject(err) : resolve();
      });
    }
    this.native.end(function() {
      self._errorAllQueries(new Error("Connection terminated"));
      process.nextTick(() => {
        self.emit("end");
        if (cb)
          cb();
      });
    });
    return result;
  };
  Client.prototype._hasActiveQuery = function() {
    return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
  };
  Client.prototype._pulseQueryQueue = function(initialConnection) {
    if (!this._connected) {
      return;
    }
    if (this._hasActiveQuery()) {
      return;
    }
    const query = this._queryQueue.shift();
    if (!query) {
      if (!initialConnection) {
        this.emit("drain");
      }
      return;
    }
    this._activeQuery = query;
    query.submit(this);
    const self = this;
    query.once("_done", function() {
      self._pulseQueryQueue();
    });
  };
  Client.prototype.cancel = function(query) {
    if (this._activeQuery === query) {
      this.native.cancel(function() {});
    } else if (this._queryQueue.indexOf(query) !== -1) {
      this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
    }
  };
  Client.prototype.ref = function() {};
  Client.prototype.unref = function() {};
  Client.prototype.setTypeParser = function(oid, format, parseFn) {
    return this._types.setTypeParser(oid, format, parseFn);
  };
  Client.prototype.getTypeParser = function(oid, format) {
    return this._types.getTypeParser(oid, format);
  };
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS((exports, module) => {
  var Client = require_client();
  var defaults = require_defaults();
  var Connection = require_connection();
  var Result = require_result();
  var utils = require_utils();
  var Pool = require_pg_pool();
  var TypeOverrides = require_type_overrides();
  var { DatabaseError } = require_dist();
  var { escapeIdentifier, escapeLiteral } = require_utils();
  var poolFactory = (Client2) => {
    return class BoundPool extends Pool {
      constructor(options) {
        super(options, Client2);
      }
    };
  };
  var PG = function(clientConstructor) {
    this.defaults = defaults;
    this.Client = clientConstructor;
    this.Query = this.Client.Query;
    this.Pool = poolFactory(this.Client);
    this._pools = [];
    this.Connection = Connection;
    this.types = require_pg_types();
    this.DatabaseError = DatabaseError;
    this.TypeOverrides = TypeOverrides;
    this.escapeIdentifier = escapeIdentifier;
    this.escapeLiteral = escapeLiteral;
    this.Result = Result;
    this.utils = utils;
  };
  if (typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined") {
    module.exports = new PG(require_client2());
  } else {
    module.exports = new PG(Client);
    Object.defineProperty(module.exports, "native", {
      configurable: true,
      enumerable: false,
      get() {
        let native = null;
        try {
          native = new PG(require_client2());
        } catch (err) {
          if (err.code !== "MODULE_NOT_FOUND") {
            throw err;
          }
        }
        Object.defineProperty(module.exports, "native", {
          value: native
        });
        return native;
      }
    });
  }
});

// node_modules/pg/esm/index.mjs
var import_lib = __toESM(require_lib2(), 1);
var Client = import_lib.default.Client;
var Pool = import_lib.default.Pool;
var Connection = import_lib.default.Connection;
var types = import_lib.default.types;
var Query = import_lib.default.Query;
var DatabaseError = import_lib.default.DatabaseError;
var escapeIdentifier = import_lib.default.escapeIdentifier;
var escapeLiteral = import_lib.default.escapeLiteral;
var Result = import_lib.default.Result;
var TypeOverrides = import_lib.default.TypeOverrides;
var defaults = import_lib.default.defaults;

// src/config/load_env.ts
class LoadEnv {
  static loadDBConfig = {
    DB_HOST: Bun.env.DB_HOST || "",
    DB_HOST_LOCAL: Bun.env.DB_HOST_LOCAL || "",
    DB_PORT: Bun.env.DB_PORT || "",
    DB_USER: Bun.env.DB_USER || "",
    DB_USER_LOCAL: Bun.env.DB_USER_LOCAL || "",
    DB_PASSWORD: Bun.env.DB_PASSWORD || "",
    DB_NAME_LOCAL: Bun.env.DB_NAME_LOCAL || "",
    DB_NAME: Bun.env.DB_NAME || ""
  };
  static loadAppEnv = {
    APP_ENV: Bun.env.APP_ENV || ""
  };
  static loadCreateDB = {
    CREATE_DB_OAPP: Bun.env.CREATE_DB_OAPP || ""
  };
  static loadSendMessage = {
    MOPH_ALERT_METHOD: Bun.env.MOPH_ALERT_METHOD || "",
    MOPH_ALERT_URL: Bun.env.MOPH_ALERT_URL || "",
    MOPH_CLIENT: Bun.env.MOPH_CLIENT || "",
    MOPH_SECRET: Bun.env.MOPH_SECRET || ""
  };
  static LoadCronJob = {
    CRON_JOB_TIME: Bun.env.CRON_JOB_TIME || "01:00",
    CRON_JOB_TEST_MODE: Bun.env.CRON_JOB_TEST_MODE || "false",
    CRON_JOB_DAYS_AHEAD: Bun.env.CRON_JOB_DAYS_AHEAD || "1"
  };
}

// src/database/db_model.ts
class DBModel {
  static CREATE_OAPP_TOMORROW = `
        CREATE TABLE IF NOT EXISTS oapp_tomorrow (
            id SERIAL PRIMARY KEY,
            oapp_id INT REFERENCES oapp(oapp_id),
            hn VARCHAR(9),
            vn VARCHAR(13),
            clinic CHAR(3),
            nexttime TIME,
            date_created DATE DEFAULT NOW()::DATE,
            nextdate DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(oapp_id, nextdate)
        )`;
  static CREATE_OAPP_RESCHEDULE = `
        CREATE TABLE IF NOT EXISTS oapp_reschedule (
            id SERIAL PRIMARY KEY,
            oapp_id INT REFERENCES oapp(oapp_id),
            hn VARCHAR(9),
            vn VARCHAR(13),
            nextdate_old DATE,
            nextdate_new DATE,
            clinic CHAR(3),
            doctor VARCHAR(15),
            reschedule_by VARCHAR(150),
            reschedule_date DATE DEFAULT NOW()::DATE,
            reschedule_time TIMESTAMP DEFAULT NOW(),
            note TEXT
        )`;
  static CREATE_OAPP_TOMORROW_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_oapp_tomorrow_nextdate ON oapp_tomorrow(nextdate)",
    "CREATE INDEX IF NOT EXISTS idx_oapp_tomorrow_hn ON oapp_tomorrow(hn)"
  ];
  static CREATE_OAPP_RESCHEDULE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_oapp_reschedule_oapp_id ON oapp_reschedule(oapp_id)",
    "CREATE INDEX IF NOT EXISTS idx_oapp_reschedule_hn ON oapp_reschedule(hn)",
    "CREATE INDEX IF NOT EXISTS idx_oapp_reschedule_date ON oapp_reschedule(reschedule_date)"
  ];
  static async createTables() {
    try {
      console.log("\uD83D\uDCCB \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07...");
      await DBConn.query(this.CREATE_OAPP_TOMORROW);
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07 oapp_tomorrow \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      await DBConn.query(this.CREATE_OAPP_RESCHEDULE);
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07 oapp_reschedule \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      for (const indexSQL of this.CREATE_OAPP_TOMORROW_INDEXES) {
        await DBConn.query(indexSQL);
      }
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 indexes \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A oapp_tomorrow \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      for (const indexSQL of this.CREATE_OAPP_RESCHEDULE_INDEXES) {
        await DBConn.query(indexSQL);
      }
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 indexes \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A oapp_reschedule \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      console.log("\uD83C\uDF89 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07\u0E41\u0E25\u0E30 indexes \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07:", error);
      throw error;
    }
  }
}

// src/database/db_triggers_insert.ts
class DBModelTriggers {
  static CREATE_FUNCTION_CHECK_TOMORROW = `
        CREATE OR REPLACE FUNCTION check_tomorrow_appointment()
        RETURNS TRIGGER AS $$
        DECLARE
            is_holiday BOOLEAN := FALSE;
        BEGIN
            -- \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E48\u0E32 nextdate \u0E40\u0E1B\u0E47\u0E19\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48
            IF NEW.nextdate = CURRENT_DATE + INTERVAL '1 day' THEN
                -- \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14
                SELECT EXISTS(
                    SELECT 1 FROM holiday h WHERE h.holiday_date = NEW.nextdate
                ) INTO is_holiday;
                
                -- \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 \u0E43\u0E2B\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07 oapp_tomorrow
                IF NOT is_holiday THEN
                    INSERT INTO oapp_tomorrow (oapp_id, hn, vn, clinic, nexttime, nextdate)
                    VALUES (NEW.oapp_id, NEW.hn, NEW.vn, NEW.clinic, NEW.nexttime, NEW.nextdate)
                    ON CONFLICT (oapp_id, nextdate) DO NOTHING;
                    
                    RAISE NOTICE '\u0E19\u0E31\u0E14\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49: HN=%, VN=%, Date=%, Clinic=%, Time=%', NEW.hn, NEW.vn, NEW.nextdate, NEW.clinic, NEW.nexttime;
                ELSE
                    RAISE NOTICE '\u0E02\u0E49\u0E32\u0E21\u0E19\u0E31\u0E14\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14: HN=%, Date=%', NEW.hn, NEW.nextdate;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`;
  static CREATE_TRIGGER_CHECK_TOMORROW = `
        CREATE TRIGGER trg_oapp_check_tomorrow
        AFTER INSERT OR UPDATE OF nextdate ON oapp
        FOR EACH ROW
        EXECUTE FUNCTION check_tomorrow_appointment()`;
  static CREATE_FUNCTION_RESCHEDULE = `
        CREATE OR REPLACE FUNCTION log_oapp_reschedule()
        RETURNS TRIGGER AS $$
        DECLARE
            is_holiday BOOLEAN := FALSE;
        BEGIN
            IF OLD.nextdate IS DISTINCT FROM NEW.nextdate THEN
                -- \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E48\u0E32\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48
                SELECT EXISTS(
                    SELECT 1 FROM holiday h WHERE h.holiday_date = NEW.nextdate
                ) INTO is_holiday;
                
                IF NOT is_holiday THEN
                    INSERT INTO oapp_reschedule (
                        oapp_id, hn, vn, nextdate_old, nextdate_new,
                        clinic, doctor, reschedule_by, note
                    )
                    VALUES (
                        NEW.oapp_id, NEW.hn, NEW.vn, OLD.nextdate, NEW.nextdate,
                        NEW.clinic, NEW.doctor, NEW.app_user,
                        '\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E08\u0E32\u0E01 ' || OLD.nextdate || ' \u0E40\u0E1B\u0E47\u0E19 ' || NEW.nextdate
                    );
                    
                    RAISE NOTICE '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14: HN=%, \u0E08\u0E32\u0E01 % \u0E40\u0E1B\u0E47\u0E19 %', 
                                 NEW.hn, OLD.nextdate, NEW.nextdate;
                ELSE
                    RAISE NOTICE '\u0E02\u0E49\u0E32\u0E21\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14: HN=%, \u0E27\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48=%', 
                                 NEW.hn, NEW.nextdate;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`;
  static CREATE_TRIGGER_RESCHEDULE = `
        CREATE TRIGGER trg_oapp_reschedule
        AFTER UPDATE OF nextdate ON oapp
        FOR EACH ROW
        WHEN (OLD.nextdate IS DISTINCT FROM NEW.nextdate)
        EXECUTE FUNCTION log_oapp_reschedule()`;
  static async createTriggers() {
    try {
      console.log("\u26A1 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 triggers...");
      await DBConn.query(this.CREATE_FUNCTION_CHECK_TOMORROW);
      await DBConn.query(`DROP TRIGGER IF EXISTS trg_oapp_check_tomorrow ON oapp`);
      await DBConn.query(this.CREATE_TRIGGER_CHECK_TOMORROW);
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 trigger check_tomorrow_appointment \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      await DBConn.query(this.CREATE_FUNCTION_RESCHEDULE);
      await DBConn.query(`DROP TRIGGER IF EXISTS trg_oapp_reschedule ON oapp`);
      await DBConn.query(this.CREATE_TRIGGER_RESCHEDULE);
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 trigger log_oapp_reschedule \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      console.log("\u26A1 \u0E2A\u0E23\u0E49\u0E32\u0E07 triggers \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07 triggers:", error);
      throw error;
    }
  }
}

// src/database/db_triggers_notify.ts
class DBTriggersNotify {
  static CREATE_FUNCTION_NOTIFY_TOMORROW = `
        CREATE OR REPLACE FUNCTION notify_oapp_tomorrow()
        RETURNS TRIGGER AS $$
        DECLARE
            v_payload JSON;
        BEGIN
            v_payload := json_build_object(
                'oapp_id', NEW.oapp_id,
                'hn', NEW.hn,
                'vn', NEW.vn
            );
            
            PERFORM pg_notify('oapp_tomorrow_channel', v_payload::text);
            
            RAISE NOTICE 'Tomorrow appointment: oapp_id=%, hn=%, vn=%', NEW.oapp_id, NEW.hn, NEW.vn;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`;
  static CREATE_TRIGGER_NOTIFY_TOMORROW = `
        CREATE TRIGGER trg_oapp_tomorrow_notify
        AFTER INSERT ON oapp_tomorrow
        FOR EACH ROW
        EXECUTE FUNCTION notify_oapp_tomorrow()`;
  static CREATE_FUNCTION_NOTIFY_RESCHEDULE = `
        CREATE OR REPLACE FUNCTION notify_oapp_reschedule()
        RETURNS TRIGGER AS $$
        DECLARE
            v_payload JSON;
        BEGIN
            v_payload := json_build_object(
                'oapp_id', NEW.oapp_id,
                'hn', NEW.hn,
                'vn', NEW.vn,
                'nextdate_old', NEW.nextdate_old,
                'nextdate_new', NEW.nextdate_new
            );
            
            PERFORM pg_notify('oapp_reschedule_channel', v_payload::text);
            
            RAISE NOTICE 'Reschedule: oapp_id=%, hn=%, vn=%, old=%, new=%', 
                         NEW.oapp_id, NEW.hn, NEW.vn, NEW.nextdate_old, NEW.nextdate_new;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`;
  static CREATE_TRIGGER_NOTIFY_RESCHEDULE = `
        CREATE TRIGGER trg_oapp_reschedule_notify
        AFTER INSERT ON oapp_reschedule
        FOR EACH ROW
        EXECUTE FUNCTION notify_oapp_reschedule()`;
  static CREATE_FUNCTION_NOTIFY_CANCEL = `
        CREATE OR REPLACE FUNCTION notify_oapp_cancel()
        RETURNS TRIGGER AS $$
        DECLARE
            v_payload JSON;
        BEGIN
            v_payload := json_build_object(
                'oapp_id', NEW.oapp_id
            );
            
            PERFORM pg_notify('oapp_cancel_channel', v_payload::text);
            
            RAISE NOTICE 'Cancel: oapp_id=%', NEW.oapp_id;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`;
  static CREATE_TRIGGER_NOTIFY_CANCEL = `
        CREATE TRIGGER trg_oapp_cancel_notify
        AFTER INSERT ON oapp_cancel
        FOR EACH ROW
        EXECUTE FUNCTION notify_oapp_cancel()`;
  static async createNotifyTriggers() {
    try {
      console.log("\uD83D\uDD14 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 notification triggers...");
      await DBConn.query(this.CREATE_FUNCTION_NOTIFY_TOMORROW);
      await DBConn.query(`DROP TRIGGER IF EXISTS trg_oapp_tomorrow_notify ON oapp_tomorrow`);
      await DBConn.query(this.CREATE_TRIGGER_NOTIFY_TOMORROW);
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 trigger notify_oapp_tomorrow \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      await DBConn.query(this.CREATE_FUNCTION_NOTIFY_RESCHEDULE);
      await DBConn.query(`DROP TRIGGER IF EXISTS trg_oapp_reschedule_notify ON oapp_reschedule`);
      await DBConn.query(this.CREATE_TRIGGER_NOTIFY_RESCHEDULE);
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 trigger notify_oapp_reschedule \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      await DBConn.query(this.CREATE_FUNCTION_NOTIFY_CANCEL);
      await DBConn.query(`DROP TRIGGER IF EXISTS trg_oapp_cancel_notify ON oapp_cancel`);
      await DBConn.query(this.CREATE_TRIGGER_NOTIFY_CANCEL);
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 trigger notify_oapp_cancel \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      console.log("\uD83D\uDD14 \u0E2A\u0E23\u0E49\u0E32\u0E07 notification triggers \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07 notification triggers:", error);
      throw error;
    }
  }
}

// src/database/db_conn.ts
var appEnv = LoadEnv.loadAppEnv.APP_ENV;
var dbName = appEnv === "production" ? LoadEnv.loadDBConfig.DB_NAME : LoadEnv.loadDBConfig.DB_NAME_LOCAL;
var dbHost = appEnv === "production" ? LoadEnv.loadDBConfig.DB_HOST : LoadEnv.loadDBConfig.DB_HOST_LOCAL;
var dbUser = appEnv === "production" ? LoadEnv.loadDBConfig.DB_USER : LoadEnv.loadDBConfig.DB_USER_LOCAL;
console.log(`\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E0A\u0E49 database: ${dbName} (${appEnv || "dev"})`);

class DBConn {
  static db_hosxe = new Pool({
    host: dbHost,
    port: Number(LoadEnv.loadDBConfig.DB_PORT),
    user: dbUser,
    password: LoadEnv.loadDBConfig.DB_PASSWORD,
    database: dbName
  });
  static async connect() {
    try {
      const client = await this.db_hosxe.connect();
      console.log("Connected to database");
      client.release();
    } catch (error) {
      console.error("Error connecting to database", error);
    }
  }
  static async getDedicatedClient() {
    return await this.db_hosxe.connect();
  }
  static async query(text, params) {
    return await this.db_hosxe.query(text, params);
  }
  static async initDatabase() {
    try {
      await this.connect();
      const shouldCreateTables = LoadEnv.loadCreateDB.CREATE_DB_OAPP?.toLowerCase() === "true";
      if (shouldCreateTables) {
        console.log("\uD83D\uDCCB CREATE_DB = true - \u0E40\u0E23\u0E34\u0E48\u0E21\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07\u0E41\u0E25\u0E30 triggers");
        await DBModel.createTables();
        await DBModelTriggers.createTriggers();
        await DBTriggersNotify.createNotifyTriggers();
      } else {
        console.log("\u23ED\uFE0F CREATE_DB = false - \u0E02\u0E49\u0E32\u0E21\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07\u0E41\u0E25\u0E30 triggers");
      }
      console.log("\uD83D\uDE80 \u0E23\u0E30\u0E1A\u0E1A\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 OAPP Alert");
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25:", error);
      throw error;
    }
  }
}

// src/controllers/send_alert.ts
class OappSendAlert {
  static async sendAlert(payload) {
    try {
      const env = LoadEnv.loadSendMessage;
      const apiUrl = env.MOPH_ALERT_URL || "https://api.example.com/alert";
      const clientKey = env.MOPH_CLIENT || "";
      const secretKey = env.MOPH_SECRET || "";
      const cidDisplay = payload.cid.join(", ");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "client-key": clientKey,
          "secret-key": secretKey
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      console.log(`\uD83D\uDCE4 \u0E2A\u0E48\u0E07\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E44\u0E1B\u0E22\u0E31\u0E07 CID: ${cidDisplay}`);
      console.log(`\uD83D\uDCCA \u0E2A\u0E16\u0E32\u0E19\u0E30: ${result.message_code} - ${result.message}`);
      return result;
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19:", error);
      return {
        message: "\u0E2A\u0E48\u0E07\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
        message_code: 500
      };
    }
  }
}

// src/controllers/oapp_utils.ts
class OappUtils {
  static formatThaiDate(date) {
    const thaiMonths = [
      "\u0E21\u0E01\u0E23\u0E32\u0E04\u0E21",
      "\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C",
      "\u0E21\u0E35\u0E19\u0E32\u0E04\u0E21",
      "\u0E40\u0E21\u0E29\u0E32\u0E22\u0E19",
      "\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21",
      "\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19",
      "\u0E01\u0E23\u0E01\u0E0E\u0E32\u0E04\u0E21",
      "\u0E2A\u0E34\u0E07\u0E2B\u0E32\u0E04\u0E21",
      "\u0E01\u0E31\u0E19\u0E22\u0E32\u0E22\u0E19",
      "\u0E15\u0E38\u0E25\u0E32\u0E04\u0E21",
      "\u0E1E\u0E24\u0E28\u0E08\u0E34\u0E01\u0E32\u0E22\u0E19",
      "\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21"
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  }
  static checkEmptyValue(value) {
    if (!value || value.trim() === "" || value === null || value === undefined) {
      return "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38";
    }
    return value.trim();
  }
  static formatTime(time) {
    return this.checkEmptyValue(time);
  }
  static formatClinicName(clinicName) {
    return this.checkEmptyValue(clinicName);
  }
  static parsePatientName(ptName) {
    const nameParts = ptName.trim().split(/\s+/);
    const fname = nameParts.slice(1, -1).join(" ") || nameParts[1] || "";
    const lname = nameParts[nameParts.length - 1] || "";
    return { fname, lname };
  }
}

// src/controllers/send_alert_flex/flex_tomorrow.ts
class FlexTomorrowBuilder {
  static createAppointmentAlert(patient) {
    const { fname, lname } = OappUtils.parsePatientName(patient.pt_name);
    return {
      type: "flex",
      altText: `\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E08\u0E32\u0E01\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19: \u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E1E\u0E1A\u0E41\u0E1E\u0E17\u0E22\u0E4C - \u0E04\u0E38\u0E13 ${fname} ${lname}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19
\u0E08\u0E32\u0E01\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19`,
              weight: "bold",
              size: "lg",
              color: "#1DB446",
              wrap: true
            },
            {
              type: "text",
              text: "\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E1E\u0E1A\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E27\u0E31\u0E19\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49",
              weight: "bold",
              size: "md",
              color: "#1DB446",
              margin: "sm",
              wrap: true
            }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `\u0E40\u0E23\u0E35\u0E22\u0E19 \u0E04\u0E38\u0E13 ${fname} ${lname}`,
              weight: "bold",
              size: "lg",
              wrap: true
            },
            {
              type: "text",
              text: "\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E02\u0E2D\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E17\u0E48\u0E32\u0E19 \u0E14\u0E31\u0E07\u0E19\u0E35\u0E49",
              wrap: true,
              margin: "md",
              size: "sm"
            },
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01",
                      size: "sm",
                      color: "#555555",
                      flex: 2
                    },
                    {
                      type: "text",
                      text: OappUtils.formatClinicName(patient.clinic_name),
                      size: "sm",
                      color: "#111111",
                      flex: 5,
                      wrap: true
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
                      size: "sm",
                      color: "#555555",
                      flex: 2
                    },
                    {
                      type: "text",
                      text: OappUtils.formatThaiDate(new Date(patient.tomorrow)),
                      size: "sm",
                      color: "#111111",
                      weight: "bold",
                      flex: 5
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E40\u0E27\u0E25\u0E32",
                      size: "sm",
                      color: "#555555",
                      flex: 2
                    },
                    {
                      type: "text",
                      text: OappUtils.formatTime(patient.nexttime),
                      size: "sm",
                      color: "#111111",
                      flex: 5
                    }
                  ]
                }
              ]
            },
            {
              type: "text",
              text: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E21\u0E32\u0E15\u0E32\u0E21\u0E27\u0E31\u0E19\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
              wrap: true,
              margin: "lg",
              size: "sm",
              color: "#555555"
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "\u0E02\u0E2D\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13\u0E17\u0E35\u0E48\u0E17\u0E48\u0E32\u0E19\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19",
              wrap: true,
              size: "xs",
              color: "#aaaaaa"
            }
          ]
        }
      }
    };
  }
}

// src/controllers/oapp_tomorrow.ts
class OappTomorrowService {
  static processedNotifications = new Set;
  static async handleTomorrowNotification(payload) {
    try {
      const data = JSON.parse(payload);
      const { oapp_id, hn, vn } = data;
      const key = `oapp_tomorrow:${oapp_id}:${hn}`;
      if (this.processedNotifications.has(key)) {
        console.log(`\u23ED\uFE0F \u0E02\u0E49\u0E32\u0E21 notification \u0E0B\u0E49\u0E33: ${key}`);
        return;
      }
      this.processedNotifications.add(key);
      setTimeout(() => this.processedNotifications.delete(key), 1e4);
      console.log(`
` + "=".repeat(60));
      console.log("\uD83D\uDCC5 \u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E19\u0E31\u0E14\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49!");
      console.log("=".repeat(60));
      console.log(`\uD83C\uDFF7\uFE0F  \u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E31\u0E14: ${oapp_id}`);
      console.log(`\uD83C\uDFE5  HN: ${hn} | VN: ${vn}`);
      await this.getPatientTomorrowInfo(hn, oapp_id);
      console.log("=".repeat(60) + `
`);
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 oapp_tomorrow notification:", error);
    }
  }
  static async getPatientTomorrowInfo(hn, oapp_id) {
    try {
      const query = `
                SELECT
                    pt.cid,
                    CONCAT(pt.pname,' ',pt.fname,'  ',pt.lname) AS pt_name,
                    ot.nextdate AS tomorrow,
                    ot.nexttime AS nexttime,
                    c.name AS clinic_name
                FROM
                    patient pt
                    INNER JOIN oapp_tomorrow ot ON ot.hn = pt.hn
                    INNER JOIN clinic c ON c.clinic = ot.clinic
                WHERE pt.hn = $1 AND ot.oapp_id = $2
                LIMIT 1
            `;
      const queryResult = await DBConn.query(query, [hn, oapp_id]);
      if (queryResult.rows.length === 0) {
        console.log(`\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22 hn: ${hn}, oapp_id: ${oapp_id}`);
        return;
      }
      const patientInfo = queryResult.rows[0];
      console.log("-".repeat(40));
      console.log(`\uD83D\uDC64  \u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22: ${patientInfo.pt_name}`);
      console.log(`\uD83C\uDFF7\uFE0F  \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27: ${patientInfo.cid}`);
      console.log(`\uD83D\uDCC5  \u0E27\u0E31\u0E19\u0E19\u0E31\u0E14: ${patientInfo.tomorrow}`);
      console.log(`\uD83C\uDFE5  \u0E04\u0E25\u0E34\u0E19\u0E34\u0E01: ${OappUtils.formatClinicName(patientInfo.clinic_name)}`);
      console.log(`\u23F0  \u0E40\u0E27\u0E25\u0E32: ${OappUtils.formatTime(patientInfo.nexttime)}`);
      console.log("-".repeat(40));
      const flexMessage = FlexTomorrowBuilder.createAppointmentAlert(patientInfo);
      const payload = {
        cid: [patientInfo.cid],
        messages: [flexMessage]
      };
      const result = await OappSendAlert.sendAlert(payload);
      let statusText = "\u2753 \u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30";
      if (result.message_code === 200) {
        statusText = "\u2705 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08";
      } else if (result.message_code === 500) {
        statusText = "\u274C \u0E44\u0E21\u0E48\u0E1E\u0E1A";
      } else if (result.message_code === 401) {
        statusText = "\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E21\u0E35 CID";
      }
      console.log(`\uD83D\uDCF1 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19: ${statusText} (${result.message_code})`);
      console.log(`\uD83D\uDCE7 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21: ${result.message}`);
    } catch (error) {
      console.error(`\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E19\u0E31\u0E14\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49 hn: ${hn}, oapp_id: ${oapp_id}:`, error);
    }
  }
}

// src/controllers/send_alert_flex/flex_reschedule.ts
class FlexRescheduleBuilder {
  static createRescheduleAlert(patient) {
    const { fname, lname } = OappUtils.parsePatientName(patient.pt_name);
    return {
      type: "flex",
      altText: `\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14 - \u0E04\u0E38\u0E13 ${fname} ${lname}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19
\u0E08\u0E32\u0E01\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19`,
              weight: "bold",
              size: "lg",
              color: "#1DB446",
              wrap: true
            },
            {
              type: "text",
              text: "\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22",
              weight: "bold",
              size: "md",
              color: "#1DB446",
              margin: "sm",
              wrap: true
            }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `\u0E40\u0E23\u0E35\u0E22\u0E19 \u0E04\u0E38\u0E13 ${fname} ${lname}`,
              weight: "bold",
              size: "lg",
              wrap: true
            },
            {
              type: "text",
              text: "\u0E17\u0E32\u0E07\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E44\u0E14\u0E49\u0E17\u0E33\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E17\u0E48\u0E32\u0E19",
              wrap: true,
              margin: "md",
              size: "sm"
            },
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01",
                      size: "sm",
                      color: "#555555",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: OappUtils.formatClinicName(patient.clinic_name),
                      size: "sm",
                      color: "#111111",
                      flex: 2,
                      wrap: true
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E08\u0E32\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14\u0E40\u0E14\u0E34\u0E21",
                      size: "sm",
                      color: "#555555",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: OappUtils.formatThaiDate(new Date(patient.nextdate_old)),
                      size: "sm",
                      color: "#FF0000",
                      flex: 2,
                      weight: "bold"
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14\u0E43\u0E2B\u0E21\u0E48",
                      size: "sm",
                      color: "#555555",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: OappUtils.formatThaiDate(new Date(patient.nextdate_new)),
                      size: "sm",
                      color: "#1DB446",
                      flex: 2,
                      weight: "bold"
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E40\u0E27\u0E25\u0E32",
                      size: "sm",
                      color: "#555555",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: OappUtils.formatTime(patient.nexttime),
                      size: "sm",
                      color: "#111111",
                      flex: 2
                    }
                  ]
                }
              ]
            },
            {
              type: "text",
              text: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E21\u0E32\u0E15\u0E32\u0E21\u0E27\u0E31\u0E19\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
              wrap: true,
              margin: "lg",
              size: "sm",
              color: "#555555"
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "\u0E02\u0E2D\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13\u0E17\u0E35\u0E48\u0E17\u0E48\u0E32\u0E19\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19",
              wrap: true,
              size: "xs",
              color: "#aaaaaa"
            }
          ]
        }
      }
    };
  }
}

// src/controllers/oapp_reschedule.ts
class OappRescheduleService {
  static processedNotifications = new Set;
  static async handleRescheduleNotification(payload) {
    try {
      const data = JSON.parse(payload);
      const { oapp_id, hn, vn, nextdate_old, nextdate_new } = data;
      const key = `oapp_reschedule:${oapp_id}:${hn}:${nextdate_old}:${nextdate_new}`;
      if (this.processedNotifications.has(key)) {
        console.log(`\u23ED\uFE0F \u0E02\u0E49\u0E32\u0E21 notification \u0E0B\u0E49\u0E33: ${key}`);
        return;
      }
      this.processedNotifications.add(key);
      setTimeout(() => this.processedNotifications.delete(key), 1e4);
      console.log(`
` + "=".repeat(60));
      console.log("\uD83D\uDD04 \u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14!");
      console.log("=".repeat(60));
      console.log(`\uD83C\uDFF7\uFE0F  \u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E31\u0E14: ${oapp_id}`);
      console.log(`\uD83C\uDFE5  HN: ${hn} | VN: ${vn}`);
      console.log(`\uD83D\uDCC5  \u0E08\u0E32\u0E01: ${nextdate_old} \u2192 ${nextdate_new}`);
      await this.getPatientRescheduleInfo(hn, oapp_id);
      console.log("=".repeat(60) + `
`);
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 oapp_reschedule notification:", error);
    }
  }
  static async getPatientRescheduleInfo(hn, oapp_id) {
    try {
      const query = `
                SELECT
                    pt.cid,
                    CONCAT(pt.pname,' ',pt.fname,'  ',pt.lname) AS pt_name,
                    ore.nextdate_old,
                    ore.nextdate_new,
                    o.nexttime,
                    c.name AS clinic_name,
                    ore.note
                FROM
                    patient pt
                    INNER JOIN oapp_reschedule ore ON ore.hn = pt.hn
                    INNER JOIN oapp o ON o.oapp_id = ore.oapp_id
                    LEFT JOIN clinic c ON c.clinic = o.clinic
                WHERE pt.hn = $1 AND ore.oapp_id = $2
                ORDER BY ore.reschedule_time DESC
                LIMIT 1
            `;
      const queryResult = await DBConn.query(query, [hn, oapp_id]);
      if (queryResult.rows.length === 0) {
        console.log(`\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14 hn: ${hn}, oapp_id: ${oapp_id}`);
        return;
      }
      const patientInfo = queryResult.rows[0];
      console.log("-".repeat(40));
      console.log(`\uD83D\uDC64  \u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22: ${patientInfo.pt_name}`);
      console.log(`\uD83C\uDFF7\uFE0F  \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27: ${patientInfo.cid}`);
      console.log(`\uD83D\uDCC5  \u0E27\u0E31\u0E19\u0E19\u0E31\u0E14: ${patientInfo.nextdate_old}`);
      console.log(`\uD83D\uDCC5  \u0E27\u0E31\u0E19\u0E19\u0E31\u0E14\u0E43\u0E2B\u0E21\u0E48: ${patientInfo.nextdate_new}`);
      console.log(`\u23F0  \u0E40\u0E27\u0E25\u0E32: ${patientInfo.nexttime}`);
      console.log(`\uD83C\uDFE5  \u0E04\u0E25\u0E34\u0E19\u0E34\u0E01: ${patientInfo.clinic_name}`);
      console.log("-".repeat(40));
      const flexMessage = FlexRescheduleBuilder.createRescheduleAlert(patientInfo);
      const payload = {
        cid: [patientInfo.cid],
        messages: [flexMessage]
      };
      const result = await OappSendAlert.sendAlert(payload);
      let statusText = "\u2753 \u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30";
      if (result.message_code === 200) {
        statusText = "\u2705 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08";
      } else if (result.message_code === 500) {
        statusText = "\u274C \u0E44\u0E21\u0E48\u0E1E\u0E1A";
      } else if (result.message_code === 401) {
        statusText = "\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E21\u0E35 CID";
      }
      console.log(`\uD83D\uDCF1 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14: ${statusText} (${result.message_code})`);
      console.log(`\uD83D\uDCE7 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21: ${result.message}`);
    } catch (error) {
      console.error(`\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14 hn: ${hn}, oapp_id: ${oapp_id}:`, error);
    }
  }
  static clearProcessedNotifications() {
    this.processedNotifications.clear();
    console.log("\uD83E\uDDF9 \u0E25\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 processed reschedule notifications \u0E41\u0E25\u0E49\u0E27");
  }
}

// src/controllers/send_alert_flex/flex_cancel.ts
class FlexCancelMessage {
  static generateCancelMessage(patient) {
    const { fname, lname } = OappUtils.parsePatientName(patient.pt_name);
    return {
      type: "flex",
      altText: `\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E08\u0E32\u0E01\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19: \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22 - \u0E04\u0E38\u0E13 ${fname} ${lname}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19
\u0E08\u0E32\u0E01\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19`,
              weight: "bold",
              size: "lg",
              color: "#1DB446",
              wrap: true
            },
            {
              type: "text",
              text: "\u274C \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22",
              weight: "bold",
              size: "md",
              color: "#FF0000",
              margin: "sm",
              wrap: true
            }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `\u0E40\u0E23\u0E35\u0E22\u0E19 \u0E04\u0E38\u0E13 ${fname} ${lname}`,
              weight: "bold",
              size: "lg",
              wrap: true
            },
            {
              type: "text",
              text: "\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E02\u0E2D\u0E41\u0E08\u0E49\u0E07\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E17\u0E48\u0E32\u0E19 \u0E14\u0E31\u0E07\u0E19\u0E35\u0E49",
              wrap: true,
              margin: "md",
              size: "sm"
            },
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14",
                      size: "sm",
                      color: "#555555",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: OappUtils.formatThaiDate(new Date(patient.nextdate)),
                      size: "sm",
                      color: "#FF0000",
                      flex: 2,
                      weight: "bold"
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01",
                      size: "sm",
                      color: "#555555",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: OappUtils.formatClinicName(patient.clinic_name),
                      size: "sm",
                      color: "#111111",
                      flex: 2,
                      wrap: true
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25",
                      size: "sm",
                      color: "#555555",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: patient.cancel_note || "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38",
                      size: "sm",
                      color: "#111111",
                      flex: 2,
                      wrap: true
                    }
                  ]
                }
              ]
            },
            {
              type: "text",
              text: `\u0E02\u0E2D\u0E2D\u0E20\u0E31\u0E22\u0E2B\u0E32\u0E01\u0E17\u0E32\u0E07\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25
\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E42\u0E17\u0E23\u0E21\u0E32\u0E41\u0E08\u0E49\u0E07\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22`,
              wrap: true,
              margin: "lg",
              size: "sm",
              color: "#555555"
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "\u0E02\u0E2D\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13\u0E17\u0E35\u0E48\u0E17\u0E48\u0E32\u0E19\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E1A\u0E32\u0E07\u0E40\u0E25\u0E19",
              wrap: true,
              size: "xs",
              color: "#aaaaaa"
            }
          ]
        }
      }
    };
  }
}

// src/controllers/oapp_cancel.ts
class OappCancelService {
  static processedNotifications = new Set;
  static async handleCancelNotification(payload) {
    try {
      const data = JSON.parse(payload);
      const { oapp_id } = data;
      if (!oapp_id || isNaN(oapp_id)) {
        console.log(`\u274C oapp_id \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: ${payload}`);
        return;
      }
      const key = `oapp_cancel:${oapp_id}`;
      if (this.processedNotifications.has(key)) {
        console.log(`\u23ED\uFE0F \u0E02\u0E49\u0E32\u0E21 notification \u0E0B\u0E49\u0E33: ${key}`);
        return;
      }
      this.processedNotifications.add(key);
      setTimeout(() => this.processedNotifications.delete(key), 1e4);
      console.log(`
` + "=".repeat(60));
      console.log("\u274C \u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E19\u0E31\u0E14!");
      console.log("=".repeat(60));
      console.log(`\uD83C\uDFF7\uFE0F  \u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E31\u0E14: ${oapp_id}`);
      await this.getPatientCancelInfo(oapp_id);
      console.log("=".repeat(60) + `
`);
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 oapp_cancel notification:", error);
    }
  }
  static async getPatientCancelInfo(oapp_id) {
    try {
      const query = `
                SELECT
                    pt.CID,
                    CONCAT(pt.pname, ' ', pt.fname, '  ', pt.lname) AS pt_name,
                    o.nextdate,
                    oc.cancel_note,
                    c.name AS clinic_name
                FROM
                    patient pt
                    INNER JOIN oapp o ON o.hn = pt.hn
                    LEFT JOIN oapp_cancel oc ON oc.oapp_id = o.oapp_id
                    LEFT JOIN clinic c ON c.clinic = o.clinic
                WHERE o.oapp_id = $1
                LIMIT 1
            `;
      const queryResult = await DBConn.query(query, [oapp_id]);
      if (queryResult.rows.length > 0) {
        const patientInfo = queryResult.rows[0];
        console.log("-".repeat(40));
        console.log(`\uD83D\uDC64  \u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22: ${patientInfo.pt_name}`);
        console.log(`\uD83C\uDFF7\uFE0F  \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27: ${patientInfo.cid}`);
        console.log(`\uD83D\uDCC5  \u0E27\u0E31\u0E19\u0E19\u0E31\u0E14: ${patientInfo.nextdate}`);
        console.log(`\u274C  \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01: ${patientInfo.cancel_note}`);
        console.log(`\uD83C\uDFE5  \u0E04\u0E25\u0E34\u0E19\u0E34\u0E01: ${patientInfo.clinic_name}`);
        console.log("-".repeat(40));
        const flexMessage = FlexCancelMessage.generateCancelMessage(patientInfo);
        const payload = {
          cid: [patientInfo.cid],
          messages: [flexMessage]
        };
        const result = await OappSendAlert.sendAlert(payload);
        let statusText = "\u2753 \u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30";
        if (result.message_code === 200) {
          statusText = "\u2705 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08";
        } else if (result.message_code === 500) {
          statusText = "\u274C \u0E44\u0E21\u0E48\u0E1E\u0E1A";
        } else if (result.message_code === 401) {
          statusText = "\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E21\u0E35 CID";
        }
        console.log(`\uD83D\uDCF1 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19: ${statusText} (${result.message_code})`);
        console.log(`\uD83D\uDCE7 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21: ${result.message}`);
        return;
      }
      console.log(`\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E19\u0E31\u0E14 oapp_id: ${oapp_id}`);
    } catch (error) {
      console.error(`\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 oapp_id: ${oapp_id}:`, error);
    }
  }
}

// src/controllers/service_connect.ts
class OappService {
  static client = null;
  static isConnected = false;
  static isHealthy = false;
  static processedNotifications = new Set;
  static heartbeatInterval = null;
  static async connect() {
    try {
      await this.cleanup();
      this.client = await DBConn.getDedicatedClient();
      await this.client.query("LISTEN oapp_tomorrow_channel");
      await this.client.query("LISTEN oapp_reschedule_channel");
      await this.client.query("LISTEN oapp_cancel_channel");
      this.client.on("notification", this.handleNotification.bind(this));
      this.client.on("error", this.onConnectionError.bind(this));
      this.isConnected = true;
      this.startHeartbeat();
    } catch (error) {
      console.error("\u274C Error \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D service:", error);
      this.isConnected = false;
      setTimeout(() => this.reconnect(), 5000);
    }
  }
  static async reconnect() {
    this.isHealthy = false;
    await this.connect();
  }
  static async cleanup() {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.release();
      this.client = null;
    }
    this.processedNotifications.clear();
    this.isConnected = false;
  }
  static async handleNotification(msg) {
    if (!msg.payload)
      return;
    console.log(`\uD83D\uDD14 \u0E23\u0E31\u0E1A notification \u0E08\u0E32\u0E01 ${msg.channel}:`, msg.payload);
    if (msg.channel === "oapp_tomorrow_channel") {
      await OappTomorrowService.handleTomorrowNotification(msg.payload);
      return;
    }
    if (msg.channel === "oapp_reschedule_channel") {
      await OappRescheduleService.handleRescheduleNotification(msg.payload);
      return;
    }
    if (msg.channel === "oapp_cancel_channel") {
      await OappCancelService.handleCancelNotification(msg.payload);
      return;
    }
    console.log(`\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01 channel: ${msg.channel}`);
  }
  static onConnectionError(err) {
    console.error("\u274C oapp connection error:", err);
    this.isConnected = false;
    this.reconnect();
  }
  static getConnectionStatus() {
    return this.isConnected && this.isHealthy;
  }
  static async testConnection() {
    return this.client ? await this.checkConnection() : false;
  }
  static async disconnect() {
    this.stopHeartbeat();
    await this.cleanup();
  }
  static startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        console.log("\u26A0\uFE0F \u0E15\u0E23\u0E27\u0E08\u0E1E\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E02\u0E32\u0E14 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E43\u0E2B\u0E21\u0E48...");
        this.isHealthy = false;
        this.reconnect();
        return;
      }
      if (!this.isHealthy) {
        console.log("\u2705 \u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E1B\u0E01\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27");
        this.isHealthy = true;
      } else {
        console.log("\uD83D\uDC93 Connection heartbeat OK");
      }
    }, 60 * 60 * 1000);
  }
  static stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log("\uD83D\uDD07 \u0E2B\u0E22\u0E38\u0E14\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A heartbeat");
    }
  }
  static async checkConnection() {
    try {
      return this.client ? (await this.client.query("SELECT 1"), true) : false;
    } catch (error) {
      console.error("\u274C \u0E15\u0E23\u0E27\u0E08\u0E1E\u0E1A\u0E1B\u0E31\u0E0D\u0E2B\u0E32 heartbeat:", error);
      return false;
    }
  }
}

// src/controllers/oapp_cron_job.ts
class OappCronJob {
  static isRunning = false;
  static schedulerId = null;
  static start() {
    if (this.schedulerId) {
      console.log("\u26A0\uFE0F Cron job \u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27");
      return;
    }
    const isTestMode = LoadEnv.LoadCronJob.CRON_JOB_TEST_MODE === "true";
    if (isTestMode) {
      console.log("\uD83E\uDDEA OAPP Cron Job (TEST MODE - \u0E17\u0E38\u0E01 30 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35)");
      this.checkTomorrowAppointments();
      this.schedulerId = setInterval(() => this.checkTomorrowAppointments(), 30000);
    } else {
      const cronTime = LoadEnv.LoadCronJob.CRON_JOB_TIME || "01:00";
      console.log(`\uD83D\uDE80 OAPP Cron Job (DAILY MODE - \u0E17\u0E38\u0E01\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32 ${cronTime})`);
      this.scheduleDaily();
    }
  }
  static stop() {
    if (this.schedulerId) {
      clearTimeout(this.schedulerId);
      clearInterval(this.schedulerId);
      this.schedulerId = null;
      console.log("\uD83D\uDED1 \u0E2B\u0E22\u0E38\u0E14 OAPP Cron Job");
    }
  }
  static scheduleDaily() {
    const [hours, minutes] = (LoadEnv.LoadCronJob.CRON_JOB_TIME || "01:00").split(":");
    const now = new Date;
    const nextRun = new Date;
    nextRun.setHours(parseInt(hours || "1") || 1, parseInt(minutes || "0") || 0, 0, 0);
    if (nextRun <= now)
      nextRun.setDate(nextRun.getDate() + 1);
    const delay = nextRun.getTime() - Date.now();
    console.log(`\u23F0 \u0E23\u0E2D\u0E1A\u0E16\u0E31\u0E14\u0E44\u0E1B: ${nextRun.toLocaleString("th-TH")}`);
    this.schedulerId = setTimeout(() => {
      this.checkTomorrowAppointments();
      this.scheduleDaily();
    }, delay);
  }
  static async checkTomorrowAppointments() {
    if (this.isRunning)
      return;
    this.isRunning = true;
    try {
      const daysAhead = parseInt(LoadEnv.LoadCronJob.CRON_JOB_DAYS_AHEAD) || 1;
      const countResult = await DBConn.query(`
                SELECT COUNT(*) as total
                FROM oapp o
                WHERE o.nextdate = CURRENT_DATE + INTERVAL '${daysAhead} day'
                AND NOT EXISTS (SELECT 1 FROM holiday h WHERE h.holiday_date = o.nextdate)
            `);
      const totalFound = parseInt(countResult.rows[0]?.total || 0);
      const holidayResult = await DBConn.query(`
                SELECT COUNT(*) as holiday_count
                FROM oapp o
                WHERE o.nextdate = CURRENT_DATE + INTERVAL '${daysAhead} day'
                AND EXISTS (SELECT 1 FROM holiday h WHERE h.holiday_date = o.nextdate)
            `);
      const holidayCount = parseInt(holidayResult.rows[0]?.holiday_count || 0);
      const insertResult = await DBConn.query(`
                INSERT INTO oapp_tomorrow (oapp_id, hn, vn, clinic, nexttime, nextdate)
                SELECT o.oapp_id, o.hn, o.vn, o.clinic, o.nexttime, o.nextdate
                FROM oapp o
                WHERE o.nextdate = CURRENT_DATE + INTERVAL '${daysAhead} day'
                AND NOT EXISTS (SELECT 1 FROM oapp_tomorrow ot WHERE ot.oapp_id = o.oapp_id AND ot.nextdate = o.nextdate)
                AND NOT EXISTS (SELECT 1 FROM holiday h WHERE h.holiday_date = o.nextdate)
                ON CONFLICT (oapp_id, nextdate) DO NOTHING
                RETURNING hn, vn, clinic, nexttime
            `);
      const inserted = insertResult.rows.length;
      console.log(`\uD83D\uDCCA \u0E1E\u0E1A\u0E19\u0E31\u0E14\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49: ${totalFound} \u0E04\u0E19 | INSERT \u0E40\u0E02\u0E49\u0E32 oapp_tomorrow: ${inserted} \u0E04\u0E19 ${inserted === totalFound ? "\u2705" : "\u26A0\uFE0F"}`);
      if (holidayCount > 0) {
        console.log(`\uD83D\uDEAB \u0E02\u0E49\u0E32\u0E21\u0E19\u0E31\u0E14\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14: ${holidayCount} \u0E04\u0E19`);
      }
      if (inserted < totalFound) {
        const existingResult = await DBConn.query(`
                    SELECT COUNT(*) as existing_count
                    FROM oapp o
                    INNER JOIN oapp_tomorrow ot ON ot.oapp_id = o.oapp_id AND ot.nextdate = o.nextdate
                    WHERE o.nextdate = CURRENT_DATE + INTERVAL '${daysAhead} day'
                    AND NOT EXISTS (SELECT 1 FROM holiday h WHERE h.holiday_date = o.nextdate)
                `);
        const existingCount = parseInt(existingResult.rows[0]?.existing_count || 0);
        const missing = totalFound - inserted - existingCount;
        console.log(`\uD83D\uDD0D \u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38 INSERT \u0E44\u0E21\u0E48\u0E2B\u0E21\u0E14:`);
        console.log(`   - \u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27\u0E43\u0E19 oapp_tomorrow: ${existingCount} \u0E04\u0E19`);
        console.log(`   - INSERT \u0E43\u0E2B\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: ${inserted} \u0E04\u0E19`);
        if (missing > 0) {
          console.log(`   - \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16 INSERT \u0E44\u0E14\u0E49: ${missing} \u0E04\u0E19 (\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A constraint \u0E2B\u0E23\u0E37\u0E2D data integrity)`);
        }
      }
      insertResult.rows.forEach((row) => console.log(`   - HN:${row.hn} VN:${row.vn} \u0E04\u0E25\u0E34\u0E19\u0E34\u0E01:${row.clinic} \u0E40\u0E27\u0E25\u0E32:${row.nexttime}`));
    } catch (error) {
      console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14:", error);
    } finally {
      this.isRunning = false;
    }
  }
}

// server.ts
async function startServer() {
  await DBConn.initDatabase();
  await OappService.connect();
  OappCronJob.start();
}
async function gracefulShutdown(signal) {
  console.log(`
\uD83D\uDED1 \u0E23\u0E31\u0E1A\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13 ${signal} - \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1B\u0E34\u0E14\u0E23\u0E30\u0E1A\u0E1A...`);
  try {
    console.log("\u23F0 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E22\u0E38\u0E14 OAPP Cron Job...");
    OappCronJob.stop();
    console.log("\u2705 \u0E2B\u0E22\u0E38\u0E14 OAPP Cron Job \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22");
    console.log("\uD83D\uDCE4 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D OappService...");
    await OappService.disconnect();
    console.log("\u2705 \u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D OappService \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22");
    console.log("\uD83C\uDF89 \u0E1B\u0E34\u0E14\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27");
    process.exit(0);
  } catch (error) {
    console.error("\u274C \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E23\u0E30\u0E1A\u0E1A:", error);
    process.exit(1);
  }
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("unhandledRejection", (reason, promise) => {
  console.error("\u274C Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});
process.on("uncaughtException", (error) => {
  console.error("\u274C Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});
startServer().catch(console.error);
