window.onload = function () {

	var md = new markdownit().use(markdownitIncrementalDOM)

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
			console.log(jsonVis)
			specs.push(jsonVis);
			counter++;
			el = "#vis-" + counter;
			console.log(el);
			htmlChart = "<div class='chart' id='vis-" + counter + "'></div>";
			document.arrive(el, {onceOnly: true}, function() {
				// 'this' refers to the newly created element
				console.log(el, this, jsonVis);
				vega.embed(this, jsonVis, opts, function(error, result) {
					console.log("it ran "  + el);
				});
			});
			return htmlChart;
		}
		var result = marked.Renderer.prototype.code.call(this, code, lang, escaped);
		return result;
	};

	// Render the vega-lite chart for each json spec
	// vegaliteRender = function (err, content) {
	// 	console.log(specs);
	// 	var num = document.getElementsByClassName('chart').length
	// 	console.log(counter, num, specs.length);
	// 	specs = specs.slice(specs.length-num, specs.length)
	// 	for (var i=0; i < num; i++) {
	// 		el = "#vis-" + (counter - num + 1 + i);
	// 		console.log(el);
	// 		vega.embed(el, specs[i], opts, function(error, result) {
	// 				console.log("it ran " + i);
	// 		});
	// 	}
	// 	return content;
	// };



	// Convert from Markdown to HTML
	var input = document.getElementById("visdown-input");
	var output = document.getElementById("visdown-output");

	window.visdown = function () {
		console.log('visdown');
		var counter = 0;
		var specs = [];
		var markdownText = input.value;
		//var tokens = marked.lexer(markdownText, { renderer: renderer });
		//console.log(tokens);
		//console.log(marked.parser(tokens));
		//output.innerHTML = marked(markdownText, { renderer: renderer })
		//frag = marked.parser(tokens);
		//console.log(frag);
		IncrementalDOM.patch(
			output, 
			md.renderToIncrementalDOM(markdownText)
		);

		//vegaliteRender();
	}

	//var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
	visdown()

}
