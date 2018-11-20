import sys
import bisect
import json
import unicodedata
import requests
import re
from bs4 import BeautifulSoup
from . import util


class Address:
    def __init__(self, addr):
        self._inputAddr = self.removeFloor(addr)
        self._OGCIOresult = self.queryOGCIO(self._inputAddr, 20)
        if self._OGCIOresult is not None:
            self._result = self.flattenOGCIO()
        else:
            self._result = None

    def flattenOGCIO(self):
        flat_result = []
        for idx, addr in enumerate(self._OGCIOresult):
            temp = {
                'rank': idx,
                'chi': addr['Address']['PremisesAddress']['ChiPremisesAddress'],
                'eng': addr['Address']['PremisesAddress']['EngPremisesAddress'],
                'geo': addr['Address']['PremisesAddress']['GeospatialInformation'],
            }
            flat_result.append(temp)
        return(flat_result)

    def ParseAddress(self):
        for (idx, aResult) in enumerate(self._result):
            self._result[idx]['match'] = util.getSimilarityWithOGCIO(
                self._inputAddr, aResult['chi'])

        self._result.sort(key=lambda x: x['match'].score, reverse=True)

        # print sorted result
        # for a in self._result[:3]:
        #     print("=========")
        #     print(a)

        return self._result[0]

# class Phrases:
    def searchPhrase(self, string, phrases):
        phrases.sort(key=lambda t: t[1])
        keys = [i[1] for i in phrases]
        idx = bisect.bisect_right(keys, string)
        if (idx == 0):
            return None
        if (string == phrases[idx-1][1]):
            self._tempOGIOAddr = [
                i for i in self._tempOGIOAddr if i[1] != string]
            return phrases[idx-1]
        return None

    def getChiAddress(self):
        addr = self._inputAddr
        result = []
        start = 0
        while (start < len(addr)):
            end = len(addr)
            while (start < end):
                string = addr[start:end]
                token = self.searchPhrase(string, self._tempOGIOAddr)
                if token == None:
                    end = end - 1
                else:
                    result += [token]
                    break
            if (end == start):
                if (len(result) > 0 and result[-1][0] == '?'):
                    result[-1][1] += addr[start]
                else:
                    result += [['?', addr[start]]]
            start += len(string)
        return result

    # Get Results from OGCIO API
    def queryOGCIO(self, RequestAddress, n):
        session = requests.Session()
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en,zh-Hant",
            "Accept-Encoding": "gzip"
        }
        base_url = "https://www.als.ogcio.gov.hk/lookup?"

        r = session.get(base_url,
                        headers=headers,
                        params={
                            "q": RequestAddress,
                            "n": n
                        })

        soup = BeautifulSoup(r.content, 'html.parser')
        if 'SuggestedAddress' in json.loads(str(soup)):
            return(json.loads(str(soup))['SuggestedAddress'])
        else:
            return None

    def flattenJSON(self, data, json_items):
        for key, value in data.items():
            if type(value) is dict:
                self.flattenJSON(value, json_items)
            elif type(value) is list:
                for i in value:
                    self.flattenJSON(i, json_items)
            else:
                if key == 'StreetName' or key == 'VillageName' or key == 'EstateName':
                    if re.search('[\u4e00-\u9fff]+', value):
                        for idx, st in enumerate(value.split(" ")):
                            json_items.append((key+str(idx+1), str(st)))
                else:
                    json_items.append((key, str(value)))
        return json_items

    def removeFloor(self, inputAddress):
        return re.sub("([0-9A-z\-\s]+[樓層]|[0-9A-z號\-\s]+[舖鋪]|地[下庫]|平台).*", "", inputAddress)
