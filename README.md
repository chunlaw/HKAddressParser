# 香港地址解析器 Hong Kong Address Parser

## 簡介 Overview
你試過分析大量文字地址嗎？你要將大量地址放在地圖嗎？想像你大量面對格式不統一、中英混雜的文字地址，然後你要短時間作空間分析（spatial analysis），歸納地址集中在哪一區、哪條街，如果你懂Google Geocoding API，也許可以免費處理千多個地址，但如果你連Excel也不懂用可怎麼辦？  

Hong Kong Address Parser converts unformatted Hong Kong address into standardize tagged address parts with corresponding coordinates. All results are verified by string matching.

[Collaction 項目頁](https://www.collaction.hk/s/hkaddressparser/)

## 版本 Versions 
[Release 0.3 (2018-12-22)](https://g0vhk-io.github.io/HKAddressParser/)  
Release 0.2 (2018-11-25)  
Release 0.1 (2018-11-07)  

## 等你幫手 We need your help!
- Any comments are welcomed. ([form](https://goo.gl/forms/r6bdJHG228IZTgIZ2))

- Mapping sub-districts into district council constituency area, please refer to this [spreadsheet](
https://docs.google.com/spreadsheets/d/1mNui-FsnnEiIXAGA-UBalqjywyBGhKMly2T9dLDhY7U/edit#gid=415942179)


## File structure
```
|
|- accuracy_test # the tool that test the accuracy
|- data # data dictionay that may use in future
|- python # the python version of address parser, in module format
||-components # the core components of the parser
||-tests # the unit tests
|-utils # some scripts that help us get the test cases
|-web # the vue.js front end and also js version of the address parser
```


## Vue.js frontend

### Development
```
# Get into the web folder
cd web

# Set up GA Tracking ID
cp .env-default .env

# Update VUE_APP_GA_TRACKING_ID in .env
VUE_APP_GA_TRACKING_ID=UA-XXXXX

# Install the required libraries and start the localhost version
npm install
npm run serve
```

### Production

```
# Go to the web folder and install the required libraries (ignore all the dev dependencies)
cd web
npm install --production

# Build the production code
npm run build

# The output website is at ./web/dist
```

## Advanced development

The whole project has two stream, one is written in python and the other one is written in js. Feel free to contribute to either side of the algo to enhance the accuracy of the program.

To test the accuracy, we have a tool inside the accuracy_test which will run both python and js and test the percentage accrodingly.

### Python version

```
# Import the components and use them
from components.core import Address
from components.util import Similarity

# Run the address parser with the address as param
address = Address(sys.argv[1])
result = ad.ParseAddress()

# Play around with the result
...
result['chi']
result['eng']
result['geo']
```

### Javascript version

```
const addressParser = require('./../web/src/lib/address-parser');

const address = 'Some address to search';
const n = 100;
const URL = 'https://www.als.ogcio.gov.hk/lookup';

// Since the addressParser wont call the ogcio directly but take the return json as param, we need to call the ogcio explicitly
const result = request.getAsync(URL, {
  headers: {
    Accept: 'application/json'
  },
  qs: {
    q: address,
    n
  },
  json: {}
}).then(res => {

  // Run the address parser with the response from ogcio
  return addressParser.searchResult(address, res.body);
}).then( results => {
  // The results contain the sorted address that the top one should be the most aliked result
})
```
