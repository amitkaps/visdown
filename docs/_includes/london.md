# London Dataset

This dataset was is about flight punctuality from London Airport to 5 major US airports 

source | dest   |  airline | flights| onTimePerf| delayAverage  | year |
:------|:-------|:---------|-------:|----------:|--------------:|-----:|
LHR    |  ORD   |  AA      |   2490 |     63.33 |    21.11      | 2010 |
LHR    |  ORD   |  BA      |   1413 |     57.36 |    23.30      | 2010 |
LHR    |  ORD   |  UA      |   2105 |     73.24 |    14.57      | 2010 |
LHR    |  ORD   |  VS      |    218 |     77.06 |    11.10      | 2010 |
...    | ...    |    ...   |  ...   |     ...   |     ...       |  ... |
LHR    |  IAD   |  US      |   2134 |     82.05 |    13.24      | 2016 |
LHR    |  IAD   |  VS      |    699 |     84.69 |     8.02      | 2016 |
LCY    |  JFK   |  BA      |    921 |     90.01 |     5.26      | 2016 |
LTN    |  EWR   |  DJT     |    333 |     87.05 |     8.44      | 2016 |

Metadata
- Observations `(n)` : 157
- Features `(p)`     : 7
  - `source`  : The source IATA airport code 
  - `dest` : The destination IATA airport code
  - `airline` : The two letter IATA code for the airline 
  - `flights` : The number of flights in that year
  - `onTimePerf` : The precentage of flights on-time in that route
  - `delayAverage` : The average delay in minutes for that route and airline
  - `year`: The year of data
  
- Source: It is adapted from flight punctuality statistics from the London Civil Aviation Authority


Make simple visualisations

```vis
data:
  url: "data/london.csv"
transform:
 -
  filter: datum.year == 2016
mark: rect
encoding:
  x:
    type: nominal
    field: source
  y:
    type: nominal
    field: dest
  color:
    type: quantitative
    field: flights
    aggregate: sum
```
