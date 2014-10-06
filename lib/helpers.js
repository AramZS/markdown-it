// Common functions for parsers

'use strict';


function isWhiteSpace(ch) {
  return ch === 0x20;
}

// Check if line has zero length or contains spaces only
function isEmpty(state, line) {
  return state.bMarks[line] + state.tShift[line] >= state.eMarks[line];
}

// Scan lines from given one and return first not empty
function skipEmptyLines(state, from) {
  for (var max = state.lineMax; from < max; from++) {
    if (state.bMarks[from] + state.tShift[from] < state.eMarks[from]) {
      break;
    }
  }
  return from;
}

// Skip spaces from given position.
function skipSpaces(state, pos) {
  for (var max = state.src.length; pos < max; pos++) {
    if (!isWhiteSpace(state.src.charCodeAt(pos))) { break; }
  }
  return pos;
}

// Skip char codes from given position
function skipChars(state, pos, code) {
  for (var max = state.src.length; pos < max; pos++) {
    if (state.src.charCodeAt(pos) !== code) { break; }
  }
  return pos;
}

// Skip char codes reverse from given position - 1
function skipCharsBack(state, pos, code, min) {
  if (pos <= min) { return pos; }

  while (pos > min) {
    if (code !== state.src.charCodeAt(--pos)) { return pos + 1; }
  }
  return pos;
}

// cut lines range from source.
function getLines(state, begin, end, indent, keepLastLF) {
  var i, first, last, queue,
      line = begin;

  if (begin >= end) {
    return '';
  }

  // Opt: don't use push queue for single line;
  if (line + 1 === end) {
    first = state.bMarks[line] + Math.min(state.tShift[line], indent);
    last = keepLastLF ? state.bMarks[end] : state.eMarks[end - 1];
    return state.src.slice(first, last);
  }

  queue = new Array(end - begin);

  for (i = 0; line < end; line++, i++) {
    first = state.bMarks[line] + Math.min(state.tShift[line], indent);

    if (line + 1 < end || keepLastLF) {
      // TODO: boundary check?
      last = state.eMarks[line] + 1;
    } else {
      last = state.eMarks[line];
    }

    queue[i] = state.src.slice(first, last);
  }

  return queue.join('');
}


function escapeHtml(str) {
  if (str.indexOf('&') >= 0) { str = str.replace(/&/g, '&amp;'); }
  if (str.indexOf('<') >= 0) { str = str.replace(/</g, '&lt;'); }
  if (str.indexOf('>') >= 0) { str = str.replace(/>/g, '&gt;'); }
  if (str.indexOf('"') >= 0) { str = str.replace(/"/g, '&quot;'); }
  return str;
}

var UNESCAPE_MD_RE = /\\([\\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;

function unescapeMd(str) {
  if (str.indexOf('\\') < 0) { return str; }
  return str.replace(UNESCAPE_MD_RE, '$1');
}

function isValidEntityCode(c) {
  /*eslint no-bitwise:0*/
  // broken sequence
  if (c >= 0xD800 && c <= 0xDFFF) { return false; }
  if (c >= 0xF5 && c <= 0xFF) { return false; }
  if (c === 0xC0 || c === 0xC1) { return false; }
  // never used
  if (c >= 0xFDD0 && c <= 0xFDEF) { return false; }
  if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) { return false; }
  // control codes
  if (c <= 0x1F) { return false; }
  if (c >= 0x7F && c <= 0x9F) { return false; }
  // out of range
  if (c > 0x10FFFF) { return false; }
  return true;
}

function fromCodePoint(c) {
  /*eslint no-bitwise:0*/
  if (c > 0xffff) {
    c -= 0x10000;
    var surrogate1 = 0xd800 + (c >> 10),
        surrogate2 = 0xdc00 + (c & 0x3ff);

    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(c);
}

var NAMED_ENTITY_RE   = /&([a-z][a-z0-9]{1,31});/gi;
var entities = require('./common/entities');

function replaceEntities(str) {
  if (str.indexOf('&') < 0) { return str; }

  return str.replace(NAMED_ENTITY_RE, function(match, name) {
    if (entities.hasOwnProperty(name)) {
      return entities[name];
    }
    return match;
  });
}

exports.isWhiteSpace = isWhiteSpace;
exports.isEmpty = isEmpty;
exports.skipEmptyLines = skipEmptyLines;
exports.skipSpaces = skipSpaces;
exports.skipChars = skipChars;
exports.getLines = getLines;
exports.skipCharsBack = skipCharsBack;
exports.escapeHtml = escapeHtml;
exports.unescapeMd = unescapeMd;
exports.isValidEntityCode = isValidEntityCode;
exports.fromCodePoint = fromCodePoint;
exports.replaceEntities = replaceEntities;