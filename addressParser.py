import sys
import bisect
import json
import unicodedata
import requests
import re
from bs4 import BeautifulSoup


class Address:
    def __init__(self, addr):
        self._inputAddr = addr
        self._OGCIOresult = self.queryOGCIO(addr, 200)
        self._result = self.flattenOGCIO()
        

    def flattenOGCIO(self):
        flat_result = []
        for addr in self._OGCIOresult:
            temp = {
                'chi': self.flattenJSON(addr['Address']['PremisesAddress']['ChiPremisesAddress'], []),
                'eng': self.flattenJSON(addr['Address']['PremisesAddress']['EngPremisesAddress'], []),
                'geo': addr['Address']['PremisesAddress']['GeospatialInformation']
            }
            flat_result.append(temp)
        return(flat_result)


    def ParseAddress(self):
        for idx, addr in enumerate(self._result):
                self._tempOGIOAddr = addr['chi']
                parsedResult = self.getChiAddress()
                self._result[idx]['status'] = parsedResult
                self._result[idx]['matched'] = len([p for p in parsedResult if type(p) is tuple])


        maxCount = max([m['matched'] for m in self._result])

        print("OGCIO Results: {}, Maximum match: {}".format(len(self._result), maxCount))
        print("------------------------")
        for idx, r in enumerate(self._result):
            #print(r['chi'])
            if r['matched'] == maxCount:
                #temp_coord = [('Latitude', self._result[idx]['geo'][0]['Latitude']), ('Longitude', self._result[idx]['geo'][0]['Longitude'])]

                print(r['chi'])
                print("--- {} matched | {}".format(r['matched'], r['status']))
                return(r)
        

# class Phrases:
    def searchPhrase(self, string, phrases):
        phrases.sort(key=lambda t: t[1])
        keys = [i[1] for i in phrases]
        idx = bisect.bisect_right (keys, string)
        # print(string)
        if ( idx == 0 ):
            return None
        if ( string == phrases[idx-1][1] ):
            # print("---")
            # print(string)
            # print("---")
            self._tempOGIOAddr = [i for i in self._tempOGIOAddr if i[1] != string]
            return phrases[idx-1]
        return None

    def getChiAddress(self):
        addr = self._inputAddr
        result = []
        start = 0
        while ( start < len( addr ) ):
            end = len(addr)
            while ( start < end ):
                string = addr[start:end]
                token = self.searchPhrase(string, self._tempOGIOAddr)
                if token == None:
                    end = end - 1 
                else:
                    result += [token]
                    break
            if (end == start):
                if ( len(result) > 0 and result[-1][0] == '?' ):
                    result[-1][1] += addr[start]
                else:
                    result += [ ['?',addr[start]] ]
            start += len(string)
        return result

    # Get Results from OGCIO API
    def queryOGCIO(self, RequestAddress, n):
        session = requests.Session()
        headers = {
            "Accept": "application/json",
            "Accept-Language":"en,zh-Hant",
            "Accept-Encoding":"gzip"
        }  
        base_url = "https://www.als.ogcio.gov.hk/lookup?"

        r = session.get(base_url, 
                    headers = headers, 
                    params = {
                        "q": RequestAddress,
                        "n": n
                    })

        soup = BeautifulSoup(r.content, 'html.parser')
        return(json.loads(str(soup))['SuggestedAddress'])


    def flattenJSON(self, data, json_items):
        for key, value in data.items():
            if type(value) is dict:
                self.flattenJSON(value, json_items)
            elif type(value) is list:
                for i in value:
                    self.flattenJSON(i, json_items)
            else:
                if key == 'StreetName' or key == 'VillageName' or key == 'EstateName':
                    #if re.search('\s[^A-z0-9,\s]', value):
                    if re.search('[\u4e00-\u9fff]+', value):
                        # print(value.split(" "))
                        for idx, st in enumerate(value.split(" ")):
                            json_items.append((key+str(idx+1), str(st)))
                else:
                    json_items.append((key, str(value)))
        return json_items



if __name__ == "__main__":
  
    #ph = Phrases()
    ad = Address(sys.argv[1])

    ad.ParseAddress()

    
            
            