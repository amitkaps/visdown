# Sample Dataset

This the most simple dataset available.

area    |  sales | profit | 
:-------|-------:|-------:|
North   |     5  |      2 |  
East    |    25  |      8 |  
West    |    15  |      6 |  
South   |    20  |      5 |  
Central |    10  |      3 |  


Lets make a simple visualisation with this dataset

```vis
data:
  url: "data/sample.csv"
mark: point
encoding:
  x:
    type: quantitative
    field: sales
  y:
    type: quantitative
    field: profit
  color:
    type: nominal
    field: area
```
