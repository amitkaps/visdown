# Data Layer

## Types of Variables
- Categorical: Nominal, Ordinal
- Continuous: Temporal, Quantitative

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

## Transforming the Data
- Filter
- Aggregation (e.g. min, max, sum, ...)
- Binning
- Create New Variables
- Sample
- Reshape (e.g. tall <-> wide)


### Filter

Lets filter this data for denominations greater than INR 10.

```vis
data:
  url: "data/notes.csv"
transform:
  -
    filter: datum.value > 10
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

### Aggregate

You can aggregate on a particular variable to do basic statistical operations like mean, sum, quantile etc.

```vis
data:
  url: data/notes.csv
mark: area
encoding:
  x:
    field: year
    type: temporal
  y:
    aggregate: sum
    field: money
    type: quantitative
  color:
    field: denom
    type: nominal
```

### Bins

Binning is a technique for grouping quantitative, continuous data values of a particular field into smaller number of “bins”

```vis
data:
  url: "data/notes.csv"
mark: bar
encoding:
  x:
    type: quantitative
    field: money
    bin: true
  y:
    aggregate: count
    type: quantitative
    field:
  color:
     field: denom
     type: nominal

```
