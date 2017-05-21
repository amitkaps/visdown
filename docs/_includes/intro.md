# Visdown

**Make visualisations using only markdown**

Write visualisation using a simple declarative markup like you would write code. Just wrap it in fenced block (three backticks) and mark the language as 'vis'.

Make simple visualisations

```vis
data:
  url: "data/cars.csv"
mark: point
encoding:
  x:
    type: quantitative
    field: kmpl
  y:
    type: quantitative
    field: price
```

Make interactive visualisations

```vis
data:
  url: "data/cars.csv"
mark: circle
encoding:
  x:
    type: quantitative
    field: kmpl
    scale:
     domain: [12,25]
  y:
    type: quantitative
    field: price
    scale:
     domain: [100,900]
  color:
    type: nominal
    field: type
  size:
    type: quantitative
    field: bhp
config:
  cell:
    width: 450
    height: 300
selection:
  brush:
    type: interval
```

# What about interaction?
[vega](https://vega.github.io/vega) supports interaction, so you can tweak it to run with it.
See working example @ [http://visdown.amitkaps.com/vega](http://visdown.amitkaps.com/vega)

# Concept and Code
Allows you to write **json** specification in simple **yaml** and uses **marked** and **vega-lite** to convert those specific code blocks in to svg.

- yaml -> json (using [yaml.js](https://github.com/jeremyfa/yaml.js))
- json -> vega-lite -> svg (using [vegalite.js](https://vega.github.io/vega-lite/))
- markdown -> html (using [marked.js](https://github.com/chjj/marked))

See the code at [http://github.com/amitkaps/visdown](http://github.com/amitkaps/visdown)

---
Handcrafted by [Amit Kapoor](http://amitkaps.com)
