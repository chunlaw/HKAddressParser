# Accuracy Tests for addressparser

The aim for this sub project is to test the acccuracy for the overall result of the addressparer script. There is some test cases inside the data folder containing both the address to search and the expected coordinates. The test program will then output the accuracy of overall address parsing.

## main.js

The main test program written in node.js.

```
# Simply install the required packages
npm install

# And run the program
node main.js

# And it can run with different options

# limit the size of the tests
node main.js --limit 10

# test only python script
node main.js --python

# test only js script
node main.js --js

# output the test result to file [default to result.json]
node main.js --output result.json
```

## run_test.py

A simple program that takes the address as input and output the result in plain JSON via stdout, running the python/components/core.py

## run_test.js

A simple program that takes the address as input and output the result in plain JSON via stdout, running the web/src/lib/address-parser.js

