# Interaction Layer

- *Selection*: Discrete (single, multi), Continuous (interval), Voronoi (nearest), Remove (toggle)
- *Events*: `click`, `dblclick`, `mouseover`, `drag`,...
- *Condition*: Change encoding, scale, filter, ...
- *Bind*: Input elements (range, radio-box,...)
- *Project*: default, fields
- *Translate*: scale


**Interaction Patterns**

- **Select**: mark something as interesting e.g. *Highlighting*
- **Explore**: show me something else e.g. *Pan or Zoom*
- **Encode**: show me a different representation e.g. *change Color, Position*
- **Abstract/Elaborate**: show me more or less detail e.g. *Overview & Details*
- **Filter**: show me something conditionally e.g. *Dynamic Queries*, *Cross Filter*
- **Connect**: show me related items e.g. *Brushing & Linking*
- **Reconfigure**: show me a different arrangement e.g. *Sorting*, *Indexing*
- **Transition**: move between different views e.g. *Staging & Animation*


## Select: **Highlighting** 

**Single**

Select single value using `click`

```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
selection:
  pts:
    type: single
mark: circle
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: number
  color:
    condition:
      selection: pts
      type: nominal
      field: denom
    value: grey
  size:
    value: 250
```

**Multiple**

Select multiple value using `click` & `shift` + `click`

```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
selection:
  pts:
    type: multi
mark: circle
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: number
  color:
    condition:
      selection: pts
      type: nominal
      field: denom
    value: grey
  size:
    value: 250
```

## Brushing

**Interval / Brushing**

Select an interval by dragging the mouse

```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
selection:
  pts:
    type: interval
mark: circle
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: number
  color:
    condition:
      selection: pts
      type: nominal
      field: denom
    value: grey
  size:
    value: 250
```

## Highlighting

**Direct**

Select direct value using `hover`

```vis
data:
  url: data/cars.csv
selection:
  pts:
    type: single
    on: mouseover
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
    condition:
      selection: pts
      field: type
      type: nominal
    value: grey
  size:
    value: 200
width: 450
height: 300
```

**Nearest**

Select nearest value using `hover`


```vis
data:
  url: data/cars.csv
selection:
  pts:
    type: single
    on: mouseover
    nearest: true
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
    condition:
      selection: pts
      field: type
      type: nominal
    value: grey
  size:
    value: 200
width: 450
height: 300
```

**Multi Line Highlight**

```vis
width: 500
height: 300
data:
  url: data/notes.csv
config:
  point:
    opacity: 0
layer:
- selection:
    highlight:
      type: single
      'on': mouseover
      nearest: 'true'
      fields:
      - denom
  mark: point
  encoding:
    x:
      field: year
      type: temporal
      axis:
        format: "%Y"
        labelAngle: 0
    y:
      field: number
      type: quantitative
    color:
      field: denom
      type: nominal
- mark: line
  encoding:
    x:
      field: year
      type: temporal
      axis: 
    y:
      field: number
      type: quantitative
    color:
      field: denom
      type: nominal
    size:
      condition:
        selection:
          not: highlight
        value: 1
      value: 3
```



## Dynamic Queries: Input Binding

Two-way binding between Input Types and Selection

```vis
data:
  url: data/cars.csv
selection:
  pts:
    type: single
    fields:
    - type
    bind: 
      input: select
      options: 
      - Hatchback
      - Sedan
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
    condition:
      selection: pts
      field: type
      type: nominal
    value: grey
  size:
    value: 200
width: 450
height: 300
```
