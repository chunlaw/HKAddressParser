# -*- coding: utf-8 -*-
import sys
import bisect
import json
import unicodedata

class Phases:

    def __init__(self):
        text = open("data/district_only.chi", "r", encoding='utf8').read()
        districts = text.split("\n")
        phases = [ (district, "d") for district in districts ]
        text = open("data/street_only.chi", "r", encoding='utf8').read()
        streets = text.split("\n")
        phases += [ ( street, "s" ) for street in streets ]
        text = open("data/building_only.chi", "r", encoding='utf8').read()
        buildings = text.split("\n")
        phases += [ ( building, "b" ) for building in buildings ]
        text = open("data/estate_only.chi", "r", encoding='utf8').read()
        estates = text.split("\n")
        phases += [ ( estate, 'e')  for estate in estates ]
        phases.sort( key=lambda t: t[0] )
        self._phases = phases
        self._keys = [phase[0] for phase in phases]

    def searchPhase(self, string):
        idx = bisect.bisect_right ( self._keys, string )
        if ( idx == 0 ):
            return None
        if ( string == self._phases[idx-1][0] ):
            return self._phases[idx-1]
        return None

    def parseAddress(self, addr):
        result = []
        start = 0
        while ( start < len( addr ) ):
            end = len(addr)
            while ( start < end ):
                string = addr[start:end]
                token = self.searchPhase(string)
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


if __name__ == "__main__":
    ph = Phases()
    address = sys.argv[1]
    print (json.dumps(ph.parseAddress(address), ensure_ascii=False))
