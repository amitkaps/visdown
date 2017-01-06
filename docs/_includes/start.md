# Starting with Visdown

This is a simple introduction to start using Visdown.

## Basic
Visdown here is a markdown application and it will render the markdown as html in the view block.

**This is an introduction to Visdown**

```
Hello world!
```

The one and only modification to markdown is to add static and interactive visualisation to the html. This is done by creating a new visualisation in fenced block (three backticks) and marking the language as 'vis'.

```vis
data:
  url: "data/notes.csv"
transform:
  filter: datum.year == 1977
mark: bar
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: money
  color:
    type: nominal
    field: denom
```

Lets build this visualisation step by step

## Data and Marks

We can add the data in directly, csv or json using the `data` entry and then encode it using `mark`

```vis
data:
  url: "data/notes.csv"
mark: bar
```

## Encoding

Right now every field is mapped to this one bar. We need to add the encoding channel to define which field we want to show. So lets add `x`channel to encoding.

```vis
data:
  url: "data/notes.csv"
mark: bar
encoding:
  x:
    type: nominal
    field: denom
```

Now we can see the eight bars corresponding to the 8 denoms that are there. Now if we add a 'y' channel to the mix, we will start to see the bars corresponding to the height of `money` value in it.

```vis
data:
  url: "data/notes.csv"
mark: bar
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: money
```

We can add the `color` channel to color them by the `denom` type

```vis
data:
  url: "data/notes.csv"
mark: bar
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: money
  color:
    type: nominal
    field: denom

```

## Transform

We want to show this chart for one particular `year`, which is 1977. So we need to transform the data and filter it for only that year. Lets do that.

```vis
data:
  url: "data/notes.csv"
transform:
  filter: datum.year == 1977
mark: bar
encoding:
  x:
    type: nominal
    field: denom
  y:
    type: quantitative
    field: money
  color:
    type: nominal
    field: denom
```
