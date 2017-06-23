window.onload = function () {

  var sc = document.getElementById("visdown-input");
  var content = sc.textContent || sc.innerText || sc.innerHTML;

  window.editor = CodeMirror.fromTextArea(sc, {
    lineNumbers: false,
		lineWrapping: true,
    mode: "markdown",
    value: content,
  });

	var marked = window.marked;

//	var md = new markdownit().use(markdownitIncrementalDOM)
	specs = [];
	var opts = {"mode": "vega-lite",
                "renderer": "svg",
                "actions": {export: true, source: false, editor: false}
               };

	//Render the vega-lite chart for each json spec
	vegaliteRender = function () {
    specs = document.getElementsByClassName('lang-vis')
		var num = specs.length;
		for (var i=0; i < num; i++) {
            el = "#vis-" + i;
            jsonVis = YAML.parse(specs[i].textContent);
						console.log(vl.compile(jsonVis).spec == undefined)
            htmlString = "<div id='vis-" + i + "'></div>"
            specs[i].insertAdjacentHTML('beforebegin', htmlString);
            specs[i].style.display = 'none';
            vega.embed(el, jsonVis, opts);
        };
	};

	//Convert from Markdown to HTML
	var input = editor.getValue();
	var output = document.getElementById("visdown-output");

	visdown = function () {
		console.log('visdown');
		var markdownText = editor.getValue();
		output.innerHTML = marked(markdownText)
		// IncrementalDOM.patch(
		// 	output,
		// 	md.renderToIncrementalDOM(markdownText)
		// );
		vegaliteRender();
	}

	visdown()

	var waiting;
	editor.on("change", function() {
			visdown();
	});

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
