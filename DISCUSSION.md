# Road map and release

## 2019-01-02

### Updates

#### Release 0.5

1. Add source for each result (ogcio/land, or both) (use v-chip)
2. Add more address component for land result (use the name component of land result to query ogcio again)
3. i18n website ???

## 2018-12-05

### Updates

#### Release 0.4

1. eng output for batch level
2. GA
    1. tick/cross for single and batch -> GA
3. Score (display in  both single and batch)
    1. Character matched (percentage)
    2. Input address type (Street/ Area, etc)
4. Expand first result for single search
5. SEO/ documentation/ UI/ Use case
6. Ho Wa
    1. github page  
    2. Create an acoount and restart, set up travis CI, we use github page

## 2018-11-21

### Updates

#### Release 0.3

1. eng output for both single (done), batch level 
2. seperate test cases to 2 files
    1. all success cases + failed cases that exceeds in OGCIO but we failed (partial done)
    2. address that cant search at OGCIO (partial done)
3. constituency area
    1. subdistrict (partial done)
4. GA (partial done)
5. prefill data for google form
6. ranking score on batch search


## 2018-11-07

## Road Map

### Release 0.2

1. batch search & download as csv
    1. chinese//latlng/confident level
    2. checkbox
    3. union fields
2. data analytics
    1. user feedback (tick/cross)
    2. google form
    3. GA
3. continuous integration

### Backlog

1. checkbox for output
2. support english search
3. api
    1. switch to python api?
4. UI/UX enhancement
    1. expandable result

## Improve accuracy

1. Get more un-formated address (and also expected lat lng) for testing
2. libpostal
3. parserator
4. ML

## Known issue for searching

1. large area e.g. (粉嶺高球場/灣仔運動場)
