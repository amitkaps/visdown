window.onload = function () {

	// Start a new marked instance and renderer
	var marked = window.marked;
	var renderer = new marked.Renderer();
	var counter = 0;
	var specs = [];
	var opts = {"mode": "vega-lite", "renderer": "svg" };


	// Render the ```vis as a div and save the json spec
	renderer.code = function (code, lang, escaped) {
		if (lang == "vis") {
			jsonVis = YAML.parse(code);
			specs.push(jsonVis);
			counter++;
			el = "#vis-" + counter;
			htmlChart = "<div id='vis-" + counter + "'></div>";
			return htmlChart;
		}
		var result = marked.Renderer.prototype.code.call(this, code, lang, escaped);
		return result;
	};

	// Render the vega-lite chart for each json spec
	vegaliteRender = function (err, content) {
		for (var i=0; i < specs.length; i++) {
			j = i + 1;
			el = "#vis-" + j;
			vega.embed(el, specs[i], opts);
		}
		return content;
	};


	// Convert from Markdown to HTML
	var input = document.querySelector("#visdown-input");
	var output = document.querySelector("#visdown-output");

	window.visdown = function () {
		console.log('visdown');
		var markdownText = input.value;
		output.innerHTML = marked(markdownText, { renderer: renderer});
		vegaliteRender();
	}
	visdown()

}

