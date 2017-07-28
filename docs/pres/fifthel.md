# Did you know?

---

## **Inline Images**

When using the **[inline]** modifier, images automatically centre and fit to the available space.

![inline](http://deckset-assets.s3-website-us-east-1.amazonaws.com/colnago2.jpg)

---

![inline, left](http://deckset-assets.s3-website-us-east-1.amazonaws.com/colnago2.jpg)

Use **[inline, left]** or **[inline, right]** to move images around. With the text underneath like this, it is the simplest ways to add captions to images.

---


```yaml
data:
  url: data/cars.csv
mark: point
encoding:
  x:
    type: quantitative
    field: kmpl
  y:
    type: quantitative
    field: price
```