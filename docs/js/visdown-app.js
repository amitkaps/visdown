window.onload = function () {

	var md = new markdownit().use(markdownitIncrementalDOM)
	var specs = [];
	var opts = {"mode": "vega-lite", 
                "renderer": "svg",
                "actions": {export: false, source: false, editor: false}
               };

	//Render the vega-lite chart for each json spec
	vegaliteRender = function () {
        specs = document.getElementsByClassName('language-vis')
		var num = specs.length;
		for (var i=0; i < num; i++) {
            el = "#vis-" + i;
            jsonVis = YAML.parse(specs[i].textContent);
            htmlString = "<div id='vis-" + i + "'></div>"
            specs[i].insertAdjacentHTML('beforebegin', htmlString);
            specs[i].style.display = 'none';
            vega.embed(el, jsonVis, opts);
        };
	};

	// Convert from Markdown to HTML
	var input = document.getElementById("visdown-input");
	var output = document.getElementById("visdown-output");

	window.visdown = function () {
		console.log('visdown');
		var markdownText = input.value;		
        IncrementalDOM.patch(
			output, 
			md.renderToIncrementalDOM(markdownText)
		);
		vegaliteRender();

		// var download = viewSource(output.innerHTML);
		// console.log(download);

	}
	visdown()

	function viewSource(source) {
		var header = '<html><head>' + " " + '</head>' + '<body><pre><code class="json">';
		var footer = '</code></pre>' + " " + '</body></html>';
		var doc = header + source + footer;
		var win = window.open('');
		//win.document.write(header + source + footer);
		//win.document.title = 'Vega JSON Source';
		return doc;
	}


}
