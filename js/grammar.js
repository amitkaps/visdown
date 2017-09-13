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

// Create vdSpec from the visCode
function spec(visCode) {
  let tokens = tokenizer(visCode);
  let lex = lexer(tokens);
  let spec = parser(lex);
  return spec;
}
 

// Start Marked Renderer
const marked = window.marked;
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



// //Create the keys and blocks of text and vis
// function _keys(tokens) {
//   let key = 0, start = 0;
//   let keys = []; 
//   tokens.forEach(function(d, i){
//     if ( d.type === "code" && d.lang === "vis") {
//       keys.push({"key": key, "type":"text", "start": start, "end": i})
//       key = key + 1; start = i+1;
//       keys.push({"key": key, "type":"vis", "start": i, "end": i+1})
//       key = key + 1
//     } 
//   })
//   // Last element is text
//   if (keys.slice(-1).end != tokens.length) {
//     keys.push({"key": key, "type":"text", "start": start, "end": tokens.length})
//   }   
//   return keys;
// }

// function _fragment(start, end, tokens, links) {
//   toks = tokens.slice(start, end);
//   toks.links = links;
//   fragment = marked.parser(tokens)
//   return fragment
// }

// function _html(keys, tokens, links) {
//   keys.forEach(function (key) {
//     IncrementalDOM.elementOpen('div', key.key);
//     IncrementalDOM.text(
//       _fragment(key.start, key.end, tokens, links)
//     );
//     IncrementalDOM.elementClose('div'); 
//   })
// }  

// // Add the hash in the ```vis
// renderer.code = function (code, lang, escaped) {
//   if (lang == "vis") {
//     el = "#vis-" + counter;
//     htmlChart = "<div id='vis-" + hash + "'></div>";
//     return htmlChart;
//   }
//   var result = marked.Renderer.prototype.code.call(this, code, lang, hash, escaped);
//   return result;
// };

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function _debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const opts = {
  "mode": "vega-lite",
  "renderer": "svg",
  "actions": {export: false, source: false, editor: false}
};

//Render the vega-lite chart for each json spec
function _render(element) {
  let specs = element.getElementsByClassName('lang-vis')
  let num = specs.length;
  for (var i=0; i < num; i++) {
    let el = "#vis-" + i;
    let jsonSpec = spec(specs[i].textContent)
    //console.log(jsonSpec)
    //console.log(vl.compile(jsonVis).spec == undefined)
    htmlString = "<div id='vis-" + i + "'></div>"
    specs[i].insertAdjacentHTML('beforebegin', htmlString);
    // specs[i].style.display = 'none';
    vega.embed(el, jsonSpec, opts);
  };
};

function visdown(input, element) {
  console.log('visdown');
  let visdownText = input;
  //console.log(_textparser(visdownText))
  let tokens = marked.lexer(visdownText)
  let links = tokens.links
  //console.log(tokens)
  //keys = _keys(tokens);
  //console.log(keys)
  // IncrementalDOM.patch(element, function() {
  //   _html(keys, tokens, links);
  // })
  // _blocks(tokens, links, keys, element)
  //element.innerHTML = marked.parser(tokens);
  //element.innerHTML = marked(visdownText);
  _render(element);
}

// For CodeMirror Editor Operations

const re = /^((```)vis\s([\s\S]+?)(^\2)\s)/gm
const newline = /\n/gm

function _countNewline(str){
  if (str ==="") {return 0 } else {
    let newlineMatch = str.match(newline)
    if (newlineMatch === null) {return 0}
    let len = newlineMatch.length
    return len
  }
}

// Create Keys to work with CodeMirror Lines
function _keys(str) {
  let visCode = str.match(re) || [];
  let nCount = str.match(newline);
  let keys = []
  let checkString = str
  let start = 0
  visCode.forEach(function(code, i){
    startIndex = checkString.indexOf(code)
    codeLength = code.length
    endIndex = startIndex + codeLength;
    beforeString = checkString.substring(0, startIndex+1);
    startLine = start + _countNewline(beforeString);
    codeLine = _countNewline(code)
    endLine = startLine + codeLine - 1
    checkString = checkString.substring(endIndex);
    keys.push({"key": i, "code": code, "newlineCode": codeLine, "start": startLine, "end": endLine})
    start = endLine + 1
  })
  return keys
}


let widgets = []
function update() {
  editor.operation(function(){
    for (var i = 0; i < widgets.length; ++i)
      editor.removeLineWidget(widgets[i]);
    widgets.length = 0;

    keys = _keys(editor.getValue());
    keys.forEach(function(key, i){
      console.log(key)
      endLine = key.end
      let msg = document.createElement("div");
      let icon = msg.appendChild(document.createElement("span"));
      icon.innerHTML = "!!";
      icon.className = "lint-error-icon";
      msg.appendChild(document.createTextNode("vis"));
      msg.className = "vis";
      widgets.push(editor.addLineWidget(endLine, msg));
    }) 
  }) 
}

window.onload = function () {

  // Codemirror setup
  let sc = document.getElementById("visdown-input");
  let content = sc.textContent || sc.innerText || sc.innerHTML;

  window.editor = CodeMirror.fromTextArea(sc, {
    lineNumbers: false,
    lineWrapping: true,
    mode: "markdown",
    value: content,
  });

  function _getChapter () {
    let hash = window.location.hash
    let file = hash.replace("#", "");
    let fileName = file == "" ? "intro.md" : file + ".md";
    let fileUrl = "pages/" + fileName;

    fetch(fileUrl).then(data => data.text()).then(data => {
      editor.setValue(data);
      });
    }

  window.onhashchange = function () {_getChapter();}
  _getChapter(); 

  //Convert from editor visdown input to HTML
  let input = editor.getValue();
  let elOutput = document.getElementById("visdown-output");
  visdown(input, elOutput)
  
  var waiting;
  //Run on editor change
  editor.on("change", function() {
    let input = editor.getValue();
    visdown(input, elOutput);
    clearTimeout(waiting);
    waiting = setTimeout(update, 500);
  });

  setTimeout(update, 100);

}