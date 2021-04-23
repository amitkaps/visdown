     "scripts": {
        "pretest": "rm -rf build && mkdir build && rollup -f umd -n visdown -o build/visdown.js -- index.js",
        "prepare": "uglifyjs build/visdown.js -c -m -o build/visdown.min.js",
        "postpublish": "zip -j build/visdown.zip -- LICENSE README.md build/visdown.js build/visdown.min.js"
},