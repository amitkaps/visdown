/*
 * visdown - a parser for vega-lite shorthand in markdown
 * Copyright (c) 2016-2017, Amit Kapoor. (MIT Licensed)
 * https://github.com/amitkaps/visdown
 */

;(function() {

 // Need to have vega, vega-lite and marked as dependencies 
 const vega = window.vega
 const vl = window.vl
 const marked = window.marked
 
// SIMPLE CONVERTOR for VISDOWN

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
    let posChannel = etoken[0];
    let fieldType = etoken[1].split(":").map(str => str.trim());
    let field = fieldType[0], type = fieldType[1]
    encode[posChannel] = {"field": field, "type": type}
  }
  return encode;
}

// Set up TYPE to GRAMMAR FUNCTION mapping 
const grammarFunc = {
  "data"  : _data,
  "filter": "_transform", "bin": "_transform",
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
function spec(visCode) {
  let tokens = tokenizer(visCode);
  let lex = lexer(tokens);
  let spec = parser(lex);
  return spec;
}
 

// Start Marked Renderer
const renderer = new marked.Renderer();
marked.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
});

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {string}
 */
function hashFnv32a(str, seed) {
  /*jshint bitwise:false */
  var i, l, hval = (seed === undefined) ? 0x811c9dc5 : seed;
  for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  // Convert to 8 digit hex string
  return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
}

const opts = {
  "mode": "vega-lite",
  "renderer": "svg",
  "actions": {export: false, source: false, editor: false}
};


function embed(el, spec, opt) {
  opt = opt || {};
  var renderer = opt.renderer || 'svg';
  var runtime = vl.compile(spec).spec; // may throw an Error if parsing fails
  var view = new vega.View(runtime)
    .logLevel(vega.Warn) // set view logging level
    .initialize(el) // set parent DOM element
    .renderer(renderer) // set render type (defaults to 'svg')
    .run(); // update and render the view    
  return Promise.resolve({view: view});
}


/**
 * Embed a Vega-lite visualization component in a web page.
 *
 * @param el        DOM element in which to place component (DOM node or CSS selector)
 * @param spec      Object : The Vega/Vega-Lite specification as a parsed JSON object.
 * @param opt       A JavaScript object containing options for embedding.
 */
function embedMain(el, spec, opt) {
  // Ensure any exceptions will be properly handled
  return new Promise((accept, reject) => {
    embed(el, spec, opt).then(accept, reject);
  });
}


//Render the vega-lite chart for each json spec
function _render(element) {
  let specs = element.getElementsByClassName('lang-vis')
  let num = specs.length;
  for (var i=0; i < num; i++) {
    let el = "#vis-" + i;
    let jsonSpec = spec(specs[i].textContent)
    console.log(jsonSpec)
    //console.log(vl.compile(jsonVis).spec == undefined)
    htmlString = "<div class='vega-embed' id='vis-" + i + "'></div>"
    specs[i].parentNode.insertAdjacentHTML('beforebegin', htmlString);
    specs[i].parentNode.style.display = 'none';
    vega.embed(el, jsonSpec, opts);
  };
};

function visdown(input, element) {
  console.log('visdown');
  let visdownText = input;
  //let tokens = marked.lexer(visdownText)
  //let links = tokens.links
  //element.innerHTML = marked.parser(tokens);
  element.innerHTML = marked(visdownText);
  _render(element);
}

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = visdown;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return visdown; });
} else {
  this.visdown = visdown;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());