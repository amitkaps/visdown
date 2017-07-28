# Visdown

**Make visualisations using only markdown**

Write visualisation using a simple declarative markup like you would write code. Just wrap it in fenced block (three backticks) and mark the language as `vis`.

*Make simple static visualisations*

```vis
data:
  url: data/cars.csv
mark: point
encoding:
  x:
    type: quantitative
    field: kmpl
  y:
    type: quantitative
    field: price
```

Visdown is based on the grammar of interactive graphic (vega-lite) which allows you to specify the visualisation including interactions in a declarative fashion.

*Make interactive visualisations*

Select the circles with the mouse

```vis
data:
  url: "data/cars.csv"
mark: circle
selection:
  brush:
    type: interval
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
    condition:
      selection: brush
      field: type
      type: nominal
    value: grey
  size:
    type: quantitative
    field: bhp
width: 450
height: 300
```

# Concept and Code

Allows you to write **json** specification in simple **yaml** and uses **marked** and **vega-lite** to convert those specific code blocks in to svg.

- yaml -> json (using [yaml.js](https://github.com/jeremyfa/yaml.js))
- json -> vega-lite -> svg (using [vegalite.js](https://vega.github.io/vega-lite/))
- markdown -> html (using [markdown-it.js](https://github.com/markdown-it/markdown-it) and [incremental-dom](https://github.com/google/incremental-dom))

See the code at [http://github.com/amitkaps/visdown](http://github.com/amitkaps/visdown)

---
Handcrafted by [Amit Kapoor](http://amitkaps.com)
