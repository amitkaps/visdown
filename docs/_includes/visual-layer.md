# Visual Layer

- Marks: Points, Ticks, Lines, Bar, Area, Glyphs, Polygon, ...
- Channels: Position, Size, Color, Shape, Path, ...
- Position: Identity, Stacked, Jitter, Dodge, ...
- Scale: Linear, Log, ...
- Coordinate: Cartesian, Polar, Geo, Parallel
- Layout: Single, Facetting, Multi-Chart


## Marks

Marks are the basic shapes used to represent the data. Play around and see if you change the `mark` to `point`, `circle`, `square`, `text`, `tick`, `bar`, `line`, and `area`.


```vis
data:
  url: "data/notes.csv"
mark: line
encoding:
  x:
    type: temporal
    field: year
  y:
    type: quantitative
    field: money
  color:
    type: nominal
    field: denom
```

## Channels

These properties are used to set the position and appearance of the mark

- Position x
- Position y
- Color
- Shape
- Size


Change the `fields` in `x` ,`y`, `shape`, `size` and `color`

```vis
data:
  url: "data/notes.csv"
transform:
  -
    filter: datum.year > 2010
mark: circle
encoding:
  x:
    type: quantitative
    field: money
  y:
    type: quantitative
    field: number
  color:
    type: nominal
    field: denom
  size:
    type: quantitative
    field: value
```

## Position

- Identity
- Stacked
- Normalise
- Jitter

To stack the values, we can use `aggregate` as `sum`

```vis
data:
  url: "data/notes.csv"
mark: area
encoding:
  x:
    type: temporal
    field: year
  y:
    type: quantitative
    field: money
    aggregate: sum
  color:
    type: nominal
    field: denom
```

To normalize the values, we can use `config` to make the `stacked` as `normalize`

```vis
data:
  url: "data/notes.csv"
mark: area
encoding:
  x:
    type: temporal
    field: year
  y:
    type: quantitative
    field: money
    aggregate: sum
  color:
    type: nominal
    field: denom
config:
  mark:
    stacked: normalize
```

## Facet

We can also create small multiple charts using `row` or `column` encoding

- Row wise
- Column wise

```vis
data:
  url: "data/notes.csv"
transform:
  -
    filter: datum.denom > 50
mark: area
encoding:
  x:
    type: temporal
    field: year
  y:
    type: quantitative
    field: money
  color:
    type: nominal
    field: denom
  column:
    type: nominal
    field: denom
```
