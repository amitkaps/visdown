# Composition

- Single View
- Multiple View
  - Layering
  - Concatentation
  - Facetting
  - Repeat

## Single View - 1

```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
mark: bar
encoding:
  y:
    type: nominal
    field: denom
  x:
    type: quantitative
    field: number
  color:
    type: nominal
    field: denom
  size:
    value: 3
```

## Single View - 2


```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
mark: circle
encoding:
  y:
    type: nominal
    field: denom
  x:
    type: quantitative
    field: number
  color:
    type: nominal
    field: denom
  size:
    value: 100
    
```

## Layered View

Simple Example

```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
layer:
- mark: bar
  encoding:
    y:
      type: nominal
      field: denom
    x:
      type: quantitative
      field: number
    color:
      type: nominal
      field: denom
    size:
      value: 2
- mark: circle
  encoding:
    y:
      type: nominal
      field: denom
    x:
      type: quantitative
      field: number
    color:
      type: nominal
      field: denom
    size:
      value: 100      

```

## Concat


```vis
hconcat:
- data:
    url: data/notes.csv
  transform:
    - filter: datum.year == 2015  
  mark: bar
  encoding:
    x:
      type: nominal
      field: denom
    y:
      type: quantitative
      field: number
    color:
      type: nominal
      field: denom
- data:
    url: data/notes.csv
  transform:
      - filter: datum.year == 2015  
  mark: circle
  encoding:
    x:
      type: nominal
      field: denom
    y:
      type: quantitative
      field: number
    color:
      type: nominal
      field: denom
    size:
      value: 100

```

## Facet

```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year > 2013
mark: bar
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: number
  color:
    type: nominal
    field: denom
  column:
    type: nominal
    field: year
```


## Repeat

```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
repeat:
  column: 
    - money
    - number
spec: 
  mark: bar
  encoding:
    x:
      type: nominal
      field: denom
    y:
      type: quantitative
      field: 
        repeat: column
    color:
      type: nominal
      field: denom
config:
  axis: 
   orient: bottom
```

## Resolve 

e.g. layering charts with different scales

**First Layer**

```vis
width: 400
height: 300
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
  y:
    aggregate: sum
    field: money
    type: quantitative
    stack: normalize
    axis:
      format: %
  color:
    field: denom
    type: nominal
```

**Second Layer**

```vis
width: 400
height: 300
data:
  url: data/notes.csv
mark: line
encoding:
  x:
    field: year
    type: temporal
    axis:
      format: %Y
      labelAngle: 0
  y:
    aggregate: sum
    field: number
    type: quantitative
  size:
    value: 3
  color:
    value: black

```

**Combined**

```vis
width: 400
height: 300
data:
  url: data/notes.csv
layer:
- mark: area
  encoding:
    x:
      field: year
      type: temporal
      axis:
        format: %Y
        labelAngle: 0
    y:
      aggregate: sum
      field: money
      type: quantitative
      stack: normalize
      axis:
        format: %
    color:
      field: denom
      type: nominal
- mark: line
  encoding:
    x:
      field: year
      type: temporal
      axis:
        format: %Y
        labelAngle: 0
    y:
      aggregate: sum
      field: number
      type: quantitative
    size:
      value: 3
    color:
      value: black
resolve:
  y:
    scale: independent
```
