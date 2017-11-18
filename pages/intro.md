# Visdown

**Make visualisations using only markdown**

Write visualisation using a simple declarative markup like you would write code. Just wrap it in fenced block (three backticks) and mark the language as `vis`.

*Make simple static visualisations*

```vis
data(cars.csv) 
filter(datum.kmpl > 20)
point(x=kmpl:Q, y=price:Q)  
```

Visdown is based on the grammar of interactive graphic (vega-lite) which allows you to specify the visualisation including interactions in a declarative fashion.

*Make interactive visualisations*

Select the circles with the mouse

```vis
data(cars.csv) | point(x=kmpl:Q, y=price:Q, color=bhp:Q)
```

---
Handcrafted by [Amit Kapoor](http://amitkaps.com)
