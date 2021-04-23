/*
 * visdown - a parser for vega-lite vis in markdown
 * Copyright (c) 2016-2018, Amit Kapoor. (MIT Licensed)
 * https://github.com/amitkaps/visdown
 */

;(function() {

 // Need to have vega, vega-lite and marked as dependencies 
//  const vega = window.vega
//  const vl = window.vl
//  const marked = window.marked
//  const YAML = window.yaml


// Start Marked Renderer
const renderer = new marked.Renderer();
marked.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
});


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
    let jsonSpec = YAML.parse(specs[i].textContent)
    console.log(jsonSpec)
    //console.log(vl.compile(jsonVis).spec == undefined)
    htmlString = "<div class='vega-embed' id='vis-" + i + "'></div>"
    specs[i].parentNode.insertAdjacentHTML('beforebegin', htmlString);
    specs[i].parentNode.style.display = 'none';
    vegaEmbed(el, jsonSpec, opts);
  };
};

function visdown(input, element) {
  console.log('visdown');
  let visdownText = input;
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