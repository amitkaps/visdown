# Datasets

Use these datasets to try out Visdown and start making interactive visualisations.

## Sample

This the most simple dataset available.

| area    |  sales | profit | 
|:--------|-------:|-------:|
| North   |     5  |      2 |  
| East    |    25  |      8 |  
| West    |    15  |      6 |  
| South   |    20  |      5 |  
| Central |    10  |      3 |  

Metadata
- Filename: `sample.csv`
- Observations `(n)` : 5
- Dimensions `(p)`   : 3

```vis
data(data/sample.csv) | point(x=sales:Q, y=profit:Q, color=area:N)
```

## Cars

A list of Indian cars and basic stats 

| brand   | model  |  price |   kmpl | type      |   bhp  |
|:--------|:-------|-------:|-------:|:----------|-------:|
| Tata    | Nano   |    199 |   23.9 | Hatchback |    38  |
| Suzuki  | Alto800|    248 |   22.7 | Hatchback |    47  |
| Hyundai | EON    |    302 |   21.1 | Hatchback |    55  |
| Nissan  | Datsun |    312 |   20.6 | Hatchback |    67  |
| ...     | ...    |    ... |    ... | ...       |   ...  |
| Suzuki  | Ciaz   |    725 |   20.7 | Sedan     |    91  |
| Skoda   | Rapid  |    756 |   15.0 | Sedan     |   104  |
| Hyundai | Verna  |    774 |   17.4 | Sedan     |   106  |
| VW      | Vento  |    785 |   16.1 | Sedan     |   104  |

Metadata
- Filename: `cars.csv`
- Observations `(n)`: 42
- Dimensions `(p)`  : 6
  - `brand`: brand
  - `model`: model name
  - `price`: price in '000 INR 
  - `kmpl` : efficiency of the car in km per liter 
  - `type` : type either Hatchback or Sedan
  - `bhp`  : brake horsepower 
- Source: Adapted from a car comparison website

```vis
data(data/cars.csv) | point(x=kmpl:Q, y = price:Q)
```

## Flights

This dataset was is about flight punctuality from 5 London Airport to 5 major US airports 

| source| dest | airline | flights| onTimePerf| delayAvg | year |
|:------|:-----|:--------|-------:|----------:|---------:|-----:|
| LHR   | ORD  |  AA     |   2490 |     63.33 |  21.11   | 2010 |
| LHR   | ORD  |  BA     |   1413 |     57.36 |  23.30   | 2010 |
| LHR   | ORD  |  UA     |   2105 |     73.24 |  14.57   | 2010 |
| LHR   | ORD  |  VS     |    218 |     77.06 |  11.10   | 2010 |
| ...   | ...  |  ...    |  ...   |     ...   |   ...    |  ... |
| LHR   | IAD  |  US     |   2134 |     82.05 |  13.24   | 2016 |
| LHR   | IAD  |  VS     |    699 |     84.69 |   8.02   | 2016 |
| LCY   | JFK  |  BA     |    921 |     90.01 |   5.26   | 2016 |
| LTN   | EWR  |  DJT    |    333 |     87.05 |   8.44   | 2016 |

Metadata
- Filename: `flights.csv`
- Observations `(n)`: 157
- Dimensions `(p)`  : 7
  - `source`  : The source IATA airport code 
  - `dest`    : The destination IATA airport code
  - `airline` : The two letter IATA code for the airline 
  - `flights` : The number of flights in that year
  - `onTimePerf` : The precentage of flights on-time in that route
  - `delayAvg`: The average delay in minutes for that route and airline
  - `year`    : The year of data
- Source: Adapted from flight punctuality statistics from the London Civil Aviation Authority

```vis
data(london.csv) 
filter(datum.year == 2016)
rect(x=source:N, y=dest:N, color=sum(flights):Q)
```

## Notes

This dataset was inspired by the demonetisation of INR 500 and INR 1000 notes in India conducted in 2016.

| year    | type   |  denom |  value |   money | number |
|--------:|:-------|-------:|-------:|--------:|-------:|
| 1977    | Notes  |   0001 |      1 |    2.72 |  2.720 |
| 1977    | Notes  |   1000 |   1000 |    0.55 |  0.001 |
| 1977    | Notes  |   0002 |      2 |    1.48 |  0.740 |
| 1977    | Notes  |   0050 |     50 |    9.95 |  0.199 |
| ...     | ...    |    ... |    ... |     ... |    ... |
| 2015    | Notes  |   0500 |    500 | 7853.75 | 15.708 |
| 2015    | Notes  |   0001 |      1 |    3.09 |  3.090 |
| 2015    | Notes  |   0010 |     10 |  320.15 | 32.015 |
| 2015    | Notes  |   1000 |   1000 | 6325.68 |  6.326 |

Metadata
- Filename: `notes.csv`
- Observations `(n)`: 351
- Features `(p)`    : 6
  - `year`  : The year of circulation
  - `type`  : The type of currency
  - `denom` : The denomination of the currency
  - `value` : The face value of the currency
  - `money` : The monetary value of currency in circulation (in INR Billion)
  - `number`: The number of currency in circulation (in INR Billion)
- Source: It is taken from Reserve Bank of India’s - Handbook of Statistics on Indian Economy 2016. Within it, Table 160 deals with [Notes and Coins in Circulation](https://www.rbi.org.in/scripts/PublicationsView.aspx?id=17293) and this dataset is only about the Notes circulation.

```vis
data(data/notes.csv) 
filter(datum.year == 2015)
bar(x=denom:N, y=money:Q, color=denom:N)
```


