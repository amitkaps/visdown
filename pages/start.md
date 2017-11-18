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
data(data/london.csv)
filter(datum.year == 2016)
rect(x=source:N, y=dest:N, color=flights:Q:sum)
```

Lets build this visualisation step by step

## Data and Marks

We can add the data in directly, csv or json using the `data` entry and then encode it using `mark`

```vis
data(data/london.csv)
rect()
```

## Encoding

Right now every field is mapped to this one rectangle. We need to add the encoding channel to define which field we want to show. So lets add `x`channel to encoding.

```vis
data(data/london.csv)
rect(x=source:N)
```

Now we can see the four rect corresponding to the 4 source destination that are there. Now if we add a 'y' channel to the mix, we will start to see the rect corresponding to the `dest` value in it.

```vis
data(data/london.csv)
rect(x=source:N, y=dest:N)
```

We can add the `color` channel to color them by the `flights`

```vis
data(data/london.csv)
rect(x=source:N, y=dest:N, color=flights:Q)
```

However we need to do color them by the sum of number of flights

```vis
data(data/london.csv)
rect(x=source:N, y=dest:N, color=flights:Q:sum)
```

## Transform

We want to show this chart for one particular `year`, which is 2016. So we need to transform the data and filter it for only that year. Lets do that.

```vis
data(data/london.csv)
filter(datum.year == 2016)
rect(x=source:N, y=dest:N, color=flights:Q:sum)
```

