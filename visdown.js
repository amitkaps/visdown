window.onload = function () {

	function createVis (yaml){
		var jsonVis = YAML.parse(yaml);
		var vgSpec = vl.compile(jsonVis).spec;
		var svg;
		vg.parse.spec(vgSpec, function(chart) {
		  view = chart({ renderer: "svg" }).update();
			svg = view.svg();
			return svg;
		});
		return svg;
	}

	var yamlString = document.querySelector("#yaml").innerHTML;
	console.log(yamlString);
	vis = createVis(yamlString);
	console.log(vis);


//	jsonVis1 = YAML.parse(yamlString.innerHTML);
//	vgSpec1 = vl.compile(jsonVis1).spec;
//  var embedSpec = {mode: "vega-lite", spec: jsonVis1, renderer: "svg" };
//  vg.embed("#vis", embedSpec, function(error, result) {});


	// Set option for block level renderer in marked.js
	// Convert code (vis) into div in the html

	var marked = window.marked;
	var renderer = new marked.Renderer();

	renderer.code = function (code, lang, escaped) {
		if (lang == "vis") {
			console.log("this is a vis voila");
			jsonVis = YAML.parse(code);
			var htmlChart = "<div id='#vis-embed'>" + JSON.stringify(jsonVis) + "</div>";
			console.log(htmlChart);
			return htmlChart;
		}
			var result = marked.Renderer.prototype.code.call(this, code, lang, escaped);
			return result;
	};

	// Convert to markdown
	var input = document.querySelector("#input");
	var output = document.querySelector("#output");
	var previousMarkdownText;

	var visdown = function () {
		var markdownText = input.value;
		previousMarkdownText = markdownText;
		output.innerHTML = marked(markdownText, { renderer: renderer });
		console.log("hello");
	}

	var didChangeOccur = function(){
      if(previousMarkdownText != input.value){
          return true;
      }
      return false;
  };

	setInterval(function(){
		if(didChangeOccur()){
			visdown();
		}
	}, 500);

	input.addEventListener('input', visdown);

}
