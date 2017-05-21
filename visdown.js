window.onload = function () {

	var md = new markdownit().use(markdownitIncrementalDOM)
	var specs = [];
	var opts = {"mode": "vega-lite", 
                "renderer": "svg",
                "actions": {export: true, source: false, editor: false}
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
	}
	visdown()
}
