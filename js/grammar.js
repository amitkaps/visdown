
// For CodeMirror Editor Operations

const visdown = window.visdown

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
  console.log(elCodemirror)
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

  setTimeout(update, 100);

}