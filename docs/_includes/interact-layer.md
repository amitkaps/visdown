# Interaction Layer

- Selection: Direct, Input Binding
- Highlighting
- Navigation: Pan, Zoom, Scale, Rotate
- Filtering, Brushing & Linking
- Sorting
- Dynamic Queries
- Transitions: Scrolling, Layers
- Staging and Animation


## Selection: Direct

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

## Selection: Input Binding

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
