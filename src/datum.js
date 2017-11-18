/*
 * datum - a shorthand for vega-lite
 * Copyright (c) 2017, Amit Kapoor. (MIT Licensed)
 * https://github.com/amitkaps/visdown
 */

;(function() {

// Create TOKENS by removing | or \n from raw spec
function tokenizer(visCode) { 
  let tokens =  visCode.trim()
                  .split(/[|\n]+/)
                  .map(str => str.trim());
  return tokens;
}

// Create GRAMMAR FUNCTIONS
function _data(type, exp) {
  let data = {"data": {"url": exp}};
  return data;
}

function _transform(type, exp) {
  let transform = {"transform": [{"filter": exp}]};
  return transform;
}

function _mark(type, exp) {
  let encode = _encoding(exp);
  let mark_encoding = {"mark": type, "encoding": encode}
  return mark_encoding  
}

function _encoding(exp) {
  let etokens = exp.split(",").map(str => str.trim())
  let encode = {}
  for(let i = 0; i < etokens.length; i++){
    let etoken = etokens[i].split("=").map(str => str.trim());
    console.log(etoken)
    let posChannel = etoken[0];
    let fieldType = etoken[1].split(":").map(str => str.trim());
    let field = fieldType[0], type = fieldType[1], aggregate = fieldType[2]
    encode[posChannel] = {"field": field, "type": type, "aggregate": aggregate}
  }
  return encode;
}

// Set up TYPE to GRAMMAR FUNCTION mapping 
const grammarFunc = {
  "data"  : _data,
  "filter": _transform, "bin": "_transform",
  "point" : _mark, "area"  : _mark, "line": _mark, 
  "bar"   : _mark, "circle": _mark, 
  "rect"  : _mark, "line"  : _mark,
  "single": "_selection", "multi": "_selection", "interval": "_selection"
}

// Use LEXER to create SEMANTIC of 'type' and 'grammar' from tokens
function lexer(tokens) {
  let lex = [];
  for (let i = 0; i < tokens.length; i++) {      
    let token = tokens[i].split("(");
    let type = token[0].trim();
    let exp = token[1].split(")")[0].trim();
    let grammar = grammarFunc[type](type, exp);
    lex[i] = {"type": type, "exp": exp, "grammar": grammar};
  }
  return lex;
}

function merge(obj) {
  let target, key;
  for (let i = 0; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }
  return obj;
}

// Use PARSER to generate the Vega-Lite spec
function parser(lex) {
  let spec = {} ;
  for (let i = 0; i < lex.length; i++) { 
    let type = lex[i].type;
    let grammar = lex[i].grammar;
    spec = merge(spec, grammar);
  }
  return spec;
}

// Create vlSpec from the visCode
function datum(visCode) {
  let tokens = tokenizer(visCode);
  let lex = lexer(tokens);
  console.log(lex);
  let spec = parser(lex);
  console.log(spec)
  return spec;
} 



if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = datum;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return datum; });
} else {
  this.datum = datum;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());