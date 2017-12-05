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
    field: kmpl
    type: quantitative
  y: 
    field: price
    type: quantitative
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

---
Handcrafted by [Amit Kapoor](http://amitkaps.com)
