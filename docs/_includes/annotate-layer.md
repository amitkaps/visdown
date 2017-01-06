# Annotate Layer

- Title and Labels
- Axis and Tick marks
- Legends
- Grids and Reference marks
- Text Annotation
- Story Elements


```vis
data:
  url: data/notes.csv
mark: area
encoding:
  x:
    field: year
    type: temporal
    axis:
      format: %Y
      labelAngle: 0
      title: Year
      titleFontSize: 12
  y:
    aggregate: sum
    field: money
    type: quantitative
    axis:
      title: Notes in Circulation (Value ₹ Billions)
      titleFontSize: 12
  color:
    field: denom
    type: nominal

config:
  cell:
    width: 400
    height: 300
```
