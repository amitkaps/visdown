

/**
 * Embed a Vega-lite visualization component in a web page.
 * This function will either throw an exception, or return a promise
 *
 * @param el        DOM element in which to place component (DOM node or CSS selector)
 * @param spec      String : A URL string from which to load the Vega specification.
                    Object : The Vega-Lite specification as a parsed JSON object.
 * @param opt       A JavaScript object containing options for embedding.
 */
function embed(el, spec, opt) {
  opt = opt || {};
  var renderer = opt.renderer || 'canvas';
  var runtime = vl.compile(vljson).spec; // may throw an Error if parsing fails
  var view = new vega.View(runtime)
    .logLevel(vega.Warn) // set view logging level
    .initialize(document.querySelector(el)) // set parent DOM element
    .renderer(renderer) // set render type (defaults to 'canvas')
    .run(); // update and render the view    
  return Promise.resolve({view: view});
}


/**
 * Embed a Vega-lite visualization component in a web page.
 *
 * @param el        DOM element in which to place component (DOM node or CSS selector)
 * @param spec      String : A URL string from which to load the Vega-lite specification.
 *                  Object : The Vega/Vega-Lite specification as a parsed JSON object.
 * @param opt       A JavaScript object containing options for embedding.
 */
function embedMain(el, spec, opt) {
  // Ensure any exceptions will be properly handled
  return new Promise((accept, reject) => {
    embed(el, spec, opt).then(accept, reject);
  });
}
