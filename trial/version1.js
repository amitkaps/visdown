window.onload = function () {

	// Start a new marked instance and renderer
	var marked = window.marked;
	var renderer = new marked.Renderer();
	var counter = 0;

	// Render the ```vis as a vega-lite chart
	renderer.code = function (code, lang, escaped) {
		if (lang == "vis") {
			var jsonVis = YAML.parse(code);
			var embedSpec = {mode: "vega-lite", spec: jsonVis, renderer: "svg" };
			counter++;
			el = "#vis-" + counter;
			vg.embed(el, embedSpec, function(error, result) {});
			htmlChart = "<div id='vis-" + counter + "'></div>";
			return htmlChart;
		}
		var result = marked.Renderer.prototype.code.call(this, code, lang, escaped);
		return result;
	};

	// Convert from Markdown to HTML
	var input = document.querySelector("#input");
	var output = document.querySelector("#output");

	window.visdown = function () {
		console.log('visdown');
		var markdownText = input.value;
		output.innerHTML = marked(markdownText, { renderer: renderer });
	}
	visdown()

}
