# -*- coding: utf-8 -*-
import sys
import bisect
import json
import unicodedata
import requests
from bs4 import BeautifulSoup

class Phrases:

    # Initialize dictionary
    def __init__(self):
        text = open("data/region.chi", "r", encoding='utf8').read()
        regions = text.split("\n")
        phrases = [ (region, "r") for region in regions ]
        text = open("data/subDistrict.chi", "r", encoding='utf8').read()
        subDistricts = text.split("\n")
        phrases += [ (subDistrict, "sd") for subDistrict in subDistricts ]
        text = open("data/street.chi", "r", encoding='utf8').read()
        streets = text.split("\n")
        phrases += [ ( street, "s" ) for street in streets ]
        text = open("data/building.chi", "r", encoding='utf8').read()
        buildings = text.split("\n")
        phrases += [ ( building, "b" ) for building in buildings ]
        text = open("data/estate.chi", "r", encoding='utf8').read()
        estates = text.split("\n")
        phrases += [ ( estate, 'e')  for estate in estates ]
        text = open("data/village.chi", "r", encoding='utf8').read()
        villages = text.split("\n")
        phrases += [ ( village, 'v')  for village in villages ]
        phrases.sort( key=lambda t: t[0] )

        self._phrases = phrases
        self._keys = [phrase[0] for phrase in phrases]

        self._initMatched = None
        self._initResidue = None

    def searchPhrase(self, string, phrases):
        keys = [i[1] for i in phrases]
        idx = bisect.bisect_right (keys, string)
        if ( idx == 0 ):
            return None
        if ( string == phrases[idx-1][1] ):
            return phrases[idx-1]
        return None

    def searchPhrase0(self, string):
        keys = self._keys
        phrases = self._phrases
        idx = bisect.bisect_right ( keys, string )
        if ( idx == 0 ):
            return None
        if ( string == phrases[idx-1][0] ):
            return phrases[idx-1]
        return None


    def findMatch(self, inputList):
        result = []
        print("findmatch")
        print(inputList)

        for c in self._initMatched:
            result += [item for item in inputList if item[1] == c[0]]
        print(result)
        print(''.join(c[1] for c in list(set(inputList) - set(result))))
        return result

    def parseAddress(self, a):
        result = []
        start = 0
        while ( start < len( self._initResidue ) ):
            end = len(self._initResidue)
            while ( start < end ):
                string = self._initResidue[start:end]
                token = self.searchPhrase(string, a)
                if token == None:
                    end = end - 1 
                else:
                    result += [token]
                    break
            if (end == start):
                if ( len(result) > 0 and result[-1][1] == '?' ):
                    result[-1][0] += self._initResidue[start]
                else:
                    result += [ [self._initResidue[start], '?'] ]
            start += len(string)
        return result

    def parseAddress0(self, addr):
        result = []
        start = 0
        while ( start < len( addr ) ):
            end = len(addr)
            while ( start < end ):
                string = addr[start:end]
                token = self.searchPhrase0(string)
                if token == None:
                    end = end - 1 
                else:
                    result += [token]
                    break
            if (end == start):
                if ( len(result) > 0 and result[-1][1] == '?' ):
                    result[-1][0] += addr[start]
                else:
                    result += [ [addr[start], '?'] ]
            start += len(string)
        return result

    # Get Results from OGCIO API
    def queryOGCIO(self, RequestAddress, n):
        base_url = "https://www.als.ogcio.gov.hk/lookup?"
        r = session.get(base_url, 
                    headers = headers, 
                    params = {
                        "q": RequestAddress,
                        "n": n
                    })
        soup = BeautifulSoup(r.content, 'html.parser')
        return(json.loads(str(soup))['SuggestedAddress'])

    def getOGCIOchi(self, request):
        chiResults =[]
        for addr in self.queryOGCIO(request,1): # Loop OGCIO results
            chiResult = addr['Address']['PremisesAddress']['ChiPremisesAddress'] # Focus on Chinese Address
            flat = (self.flattenJSON(chiResult, []))
            flat.sort(key=lambda t: t[1])#, reverse=True)
            chiResults.append(flat)
        return chiResults

    def flattenJSON(self, data, json_items):
        for key, value in data.items():
            if hasattr(value, 'items'):
                self.flattenJSON(value, json_items)
            else:
                json_items.append((key, value))
        return json_items

if __name__ == "__main__":
    ph = Phrases()
    address = sys.argv[1]

    # Look for OGCIO Result
    session = requests.Session()
    headers = {
        "Accept": "application/json",
        "Accept-Language":"en,zh-Hant",
        "Accept-Encoding":"gzip"
    }

    parsedchunks = ph.parseAddress0(address)
    print("In-house result ----------------------------------------")
    ph._initMatched = [p for p in parsedchunks if type(p) is tuple]
    ph._initResidue = ''.join(c[0] for c in parsedchunks if type(c) is list)
    
    print("Known : {} | Unknown : {}".format(ph._initMatched, ph._initResidue))
    
    possibleResults = []

    for idx, chiAddr in enumerate(ph.getOGCIOchi(address)):
        parsedresult = ph.findMatch(chiAddr) + ph.parseAddress(chiAddr)
        possibleResults.append([p for p in parsedresult if type(p) is tuple])
    matchCounts = max([len(x) for x in possibleResults])

    for r in possibleResults:
        if (len(r) == matchCounts):
            print("{} matched |  {}".format(len(r), r))