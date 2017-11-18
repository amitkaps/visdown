# Data Layer

## Types of Variables
- Categorical: Nominal, Ordinal
- Continuous: Temporal, Quantitative

```vis
data(data/notes.csv) 
line(x=year:T, y=money:Q, color=denom:N)
```

## Transforming the Data
- Filter, Sort
- Aggregate (e.g. min, max, sum, ...)
- Bin 
- Derive (new variable)
- Sample
- Reshape (e.g. tall <-> wide)


### Filter

Lets filter this data for denominations greater than INR 10.

```vis
data(data/notes.csv) 
filter(datum.value > 10)
line(x=year:T, y=money:Q, color=denom:N)
```

### Aggregate

You can aggregate on a particular variable to do basic statistical operations like mean, sum, quantile etc.

```vis
data(data/notes.csv) 
area(x=year:T, y=sum(money:Q), color=denom:N)
```

### Bins

Binning is a technique for grouping quantitative, continuous data values of a particular field into smaller number of “bins”

```vis
data(data/notes.csv) 
bar(x=bin(money:Q), y=count:Q, color=denom:N)
```
