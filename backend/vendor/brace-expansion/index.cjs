'use strict';

const implementation = require('brace-expansion-fixed');
const expand = implementation.expand ?? implementation;

module.exports = expand;
module.exports.expand = expand;
module.exports.EXPANSION_MAX = implementation.EXPANSION_MAX;
module.exports.EXPANSION_MAX_LENGTH = implementation.EXPANSION_MAX_LENGTH;
