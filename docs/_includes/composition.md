# Chart One

```vis
data:
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
config:
  bar:
    discreteBandSize: 
```

## Chart Two


```vis
data:
  url: data/notes.csv
transform:
  - filter: datum.year == 2015
mark: point
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
    
```

## Layer

```vis
data:
  url: data/notes.csv
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
  config:
    bar:
      binSpacing:
- mark: point
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

```

# Vertical Concat


```vis
hconcat:
- data:
    url: data/notes.csv
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
  config:
    bar:
      binSpacing:
- data:
    url: data/notes.csv
  mark: point
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

```
