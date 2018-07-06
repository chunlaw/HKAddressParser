# -*- coding: utf-8 -*-
import sys
import bisect
import json
import unicodedata
import requests
from bs4 import BeautifulSoup

class Phrases:

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

    def searchPhrase(self, string):
        idx = bisect.bisect_right ( self._keys, string )
        if ( idx == 0 ):
            return None
        if ( string == self._phrases[idx-1][0] ):
            return self._phrases[idx-1]
        return None

    def parseAddress(self, addr):
        result = []
        start = 0
        while ( start < len( addr ) ):
            end = len(addr)
            while ( start < end ):
                string = addr[start:end]
                token = self.searchPhrase(string)
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


if __name__ == "__main__":
    # Tokenizer
    ph = Phrases()
    address = sys.argv[1]
    print (json.dumps(ph.parseAddress(address), ensure_ascii=False))

    # Look for OGCIO Result
    session = requests.Session()
    headers = {
        "Accept": "application/json",
        "Accept-Language":"en,zh-Hant",
        "Accept-Encoding":"gzip"
    }

    for p in ph.parseAddress(address):
        if (p[1] == 'b'):
            for addr in (ph.queryOGCIO(p[0],10)): # Return 10 results
                print(addr)