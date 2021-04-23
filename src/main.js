/*
 * visdown - a parser for vega-lite vis in markdown
 * Copyright (c) 2016-2018, Amit Kapoor. (MIT Licensed)
 * https://github.com/amitkaps/visdown
 */


// Need to have vega and vega-lite as dependencies 
//  const vega = window.vega
//  const vl = window.vl


// import vega from 'vega'
// import vega-lite as vl from 'vega-lite'
import marked from 'marked'
import YAML from 'yamljs'
import vegaEmbed from 'vega-embed'

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