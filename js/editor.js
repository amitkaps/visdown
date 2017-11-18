// For Editor Operations
const visdown = window.visdown
const datum = window.datum

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {string}
 */
function _hashFnv32a(str, seed) {
  /*jshint bitwise:false */
  var i, l, hval = (seed === undefined) ? 0x811c9dc5 : seed;
  for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  // Convert to 8 digit hex string
  return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
}


// Regex for getting vis code blocks and extracting viscode
const re = /^((```)vis\s([\s\S]+?)(^\2)\s)/gm
const newline = /\n/gm
const visStart = /^```vis\s*\n/gm
const visEnd = /^```\s*\n/gm

function _countNewline(str){
  if (str === "") {return 0 } else {
    let newlineMatch = str.match(newline)
    if (newlineMatch === null) {return 0}
    let len = newlineMatch.length
    return len
  }
}

function _getVisText(str){
  let visText = str.split(visStart)[1].split(visEnd)[0]
  return visText
}

// Create Keys to work with CodeMirror Lines
function _keys(str) {
  let visCode = str.match(re) || [];
  let nCount = str.match(newline);
  let keys = []
  let checkString = str
  let start = 0
  visCode.forEach(function(code, i){
    let visText = _getVisText(code);
    let spec = datum(visText)
    let hash = _hashFnv32a(visText.trim());
    console.log(spec, code, hash);
    startIndex = checkString.indexOf(code)
    codeLength = code.length
    endIndex = startIndex + codeLength;
    beforeString = checkString.substring(0, startIndex+1);
    startLine = start + _countNewline(beforeString);
    codeLine = _countNewline(code)
    endLine = startLine + codeLine - 1
    checkString = checkString.substring(endIndex);
    keys.push({
      "key": i, "code": code, "spec": spec, "hash": hash,
      "lines": codeLine, "start": startLine, "end": endLine})
    start = endLine + 1
  })
  console.log(keys);
  return keys
}

const opts = {
    "mode": "vega-lite",
    "renderer": "svg",
    "actions": {export: false, source: false, editor: false}
  };

let widgets = []
function update() {

  editor.operation(function(){

    keys = _keys(editor.getValue());

    // ENTER + UPDATE - Add all new widgets and Update Vis if changed
    keys.forEach(function(key, i){
      let endLine = key.end
      let spec = key.spec
      let el;
      console.log(editor.lineInfo(endLine)[widgets])
      // ENTER - Add new widget when none exists
      if (editor.lineInfo(endLine).widgets === undefined) {
        el = document.createElement("div");
        el.style.minHeight = 256 + 'px';
        elVis = el.appendChild(document.createElement("div"));
        elVis.id = "vis-editor-" + i; 
        elVis.setAttribute('data-hash', key.hash);
        editor.addLineWidget(endLine, el);
        vega.embed(elVis, spec, opts)        
        console.log(el);
      } else {
        node = editor.lineInfo(endLine).widgets[0].node
        console.log(node)
        hash = node.getAttribute('data-hash')
        console.log(hash, key.hash)
        if (hash != key.hash) {
          node.setAttribute('data-hash', key.hash);
          vega.embed(node, spec, opts);
        } 
      }
    })

    // EXIT - Remove all widgets that should no longer exist

    
  })
  
}


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



window.onload = function () {

  // Codemirror setup
  let sc = document.getElementById("input-text");
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

  text = editor.getValue()
  elInput = document.getElementById("input");
  elCodemirror = editor.getWrapperElement()
  elOutput = document.getElementById("output");
  elEditor = document.getElementById("editor");
  elView = document.getElementById("view")
  elEdit = document.getElementById("edit")
  elContrast = document.getElementById("contrast")
  
  function changeContrast( event ){
    elEditor.style.backgroundColor = "white";    
    
  }

  let darkLayout = false;
  function changeContrast ( event ) {
		if ( darkLayout === false ) {
      document.body.className = 'yang';
      elCodemirror.style.backgroundColor = "#111"
      elCodemirror.style.color = "#FDFDFD"
		} else {
      document.body.className = 'yin';
      elCodemirror.style.backgroundColor = "#FDFDFD"
      elCodemirror.style.color = "#111"
    }
    console.log(darkLayout)
		darkLayout = !darkLayout;
	}

  function showOutput( event ) {
    console.log("showOutput")
    elView.style.display = "none"
    elEdit.style.display = "block"    
    elInput.style.display = "none";
    elOutput.style.display = "block";
    visdown(text, elOutput);    
  }
  
  function showInput( event) {
    elView.style.display = "block"    
    elEdit.style.display = "none"    
    elInput.style.display = "block";
    elOutput.style.display = "none";    
  }
 
  elView.onclick = showOutput
  elEdit.onclick = showInput
  elContrast.onclick = changeContrast
  
  var waiting;
  //Run on editor change
  editor.on("change", function() {
    text = editor.getValue();
    clearTimeout(waiting);
    waiting = setTimeout(update, 500);
  });

  //setTimeout(update, 100);

}