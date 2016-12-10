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
	var previousMarkdownText;

	window.visdown2 = function () {
		console.log('visdown');

		// Get the example files
		var mdfiles;
		var request = new XMLHttpRequest();
		request.open('GET', '/examples/intro.md', true);
		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				mdText = request.responseText;
				console.log(mdText);
				input.value = mdText
				visdown()
			} else {
				console.log("Error loading examples");
			}
		};
		request.onerror = function() {console.log("connection error")};
		request.send();

		// Update the output with
		var markdownText = input.value;
		output.innerHTML = marked(markdownText, { renderer: renderer });

	}
	//visdown()
	console.log(input.value);

	var visdown = function () {
		var markdownText = input.value;
		previousMarkdownText = markdownText;
		output.innerHTML = marked(markdownText, { renderer: renderer });
		console.log("Updated");
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
	}, 1000);

	input.addEventListener('input', visdown);

}
