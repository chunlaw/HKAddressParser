# 香港地址解析器 Hong Kong Address Parser

方便地址轉座標、空間分析、製作地圖的小工具。可以將大量香港地址拆細成你想要的格式。  

網站：[bit.ly/hkaddressparser](http://bit.ly/hkaddressparser)  

## 簡介 Overview
為何要拆解地址？假設你在找尋灣仔富德樓的位置，你會用Google地圖搜尋，然後得出地址全名、座標等資料。但如果你分析過千，甚至過萬個文字地址，又要顯示在地圖上，當中格式不統一、中英混雜，難道你要逐一搜尋？

香港地址解析器（Hong Kong Address Parser, HKAP）運用政府部門開放數據，比較輸入地址與搜尋結果的相似度，將香港文字地址拆解成地區、街道、門牌、大廈、座標、甚至區議會選區，方便港人分析地址資料，製作地圖。

![Result card](https://g0vhk-io.github.io/HKAddressParser/result-card.png)

## 三大功能 Features

### 地址轉座標  Convert address to coordinate
如果你要將一批地址資料顯示在地圖上，首先要將地址轉換成座標，但Google Maps API開始向用家收費，而且你要先有編程底子才可方便使用香港地址解析器可以將大量中英文地址轉換成經緯度，方便製作互動地圖。

### 中英翻譯地址  Translate address
香港人習慣雙語並用，有時你手上有一批中英夾雜的地址，香港地址解析器可以大量翻譯成中文，方便整理。

### 統一地址格式  Standardize address format
香港地址解析器可以將大量不同格式的中英地址解析成地區、街道、門牌、大廈、區議會選區等地址資料，用家下載CSV格式檔案後，可進一步作樞紐分析空間數據，歸納地址集中在哪一地區、哪條街道，從凌亂資料中提煉找出有價值的資訊。

## 採用開放數據 Source of open data 
[地址搜尋服務](https://data.gov.hk/tc-data/dataset/hk-ogcio-st_div_02-als) （政府資訊科技總監辦公室）  
[地理位置搜尋應用程式介面](https://geodata.gov.hk/gs/locationSearchAPI?l=zh-Hant-HK) （地政總署） 

## 等你幫手 We need your help!
搜尋準確度取決於香港政府資料一線通[地址搜尋服務](https://data.gov.hk/tc-data/dataset/hk-ogcio-st_div_02-als)的數據質素，如發現有地址遺漏，請直接向[政府資訊科技總監辦公室](https://data.gov.hk/tc/feedback)指正。相反，如地址搜尋服務有收錄相關地址資料，但香港地址解析器未有顯示結果，任何查詢、功能建議，請向[我們](https://goo.gl/forms/r6bdJHG228IZTgIZ2)反映。　　

## 版本 Versions 
[Release 1.0 (2019-01-16)](https://g0vhk-io.github.io/HKAddressParser/)  
Release 0.3 (2018-12-22)  
Release 0.2 (2018-11-25)  
Release 0.1 (2018-11-07)  


- Mapping sub-districts into district council constituency area, please refer to this [spreadsheet](
https://docs.google.com/spreadsheets/d/1mNui-FsnnEiIXAGA-UBalqjywyBGhKMly2T9dLDhY7U/edit#gid=415942179)


[Collaction 項目頁](https://www.collaction.hk/s/hkaddressparser/)


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
