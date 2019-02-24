import re


def matchStr(inAddr, fieldName, inStr):
    matchedPos = None
    goodness = None

    # try striping the head of inStr till match is found
    # to deal with cases like eg. inAddr = 兆康站, inStr = 港鐵兆康站
    for i in range(0, len(inStr)):
        newInStr = inStr[i:]
        matchedPosStart = inAddr.find(newInStr)
        if matchedPosStart >= 0:
            matchedPos = (matchedPosStart, matchedPosStart + len(newInStr))
            goodness = (len(newInStr)/len(inStr) - 0.5)*2
            break

        if (len(inStr) - i) <= 3: break  # give up if remaining inStr too short
        if (i >= len(inStr) // 2): break  # give up if already stripped half

    return [(fieldName, inStr, matchedPos, goodness)]


def matchChiStreetOrVillage(inAddr, inDict):
    """
    inDict is the ChiStreet field of the ogcio result, eg.
    {'StreetName': '彌敦道',
     'BuildingNoFrom': '594'   (may be absent)
     'BuildingNoTo': '596'     (may be absent)
     },

    """
    matches = []

    key = None
    if 'StreetName' in inDict: key = 'StreetName'
    if 'VillageName' in inDict: key = 'VillageName'

    inStr = inDict[key]
    inStr = inStr.split()[-1]  # to deal with case like '屯門 青麟路'
    streetMatch = matchStr(inAddr, key, inStr)[0]
    matches.append(streetMatch)

    ogcioBNoFrom = inDict.get('BuildingNoFrom', '')
    ogcioBNoTo = inDict.get('BuildingNoTo', '')

    if not ogcioBNoFrom: return matches

    inAddrBNoSpan = None  # the position of the words in the inAddr string
    inAddrBNoFrom = ''
    inAddrBNoTo = ''

    # look for street no. after the street in inAddr
    matchedPos = streetMatch[2]
    if matchedPos != None:
        matchedPosEnd = matchedPos[1]
        inStr = inAddr[matchedPosEnd:]
        reResult = re.match('([0-9A-z]+)[至及\-]*([0-9A-z]*)號', inStr)  # this matches '591-593號QWER'
        # print("a", matchedPosEnd, inStr, reResult)
        if reResult:
            inAddrBNoSpan = tuple(matchedPosEnd + x for x in reResult.span())
            inAddrBNoFrom = reResult.groups()[0]
            inAddrBNoTo = reResult.groups()[1]

    if ogcioBNoTo == '': ogcioBNoTo = ogcioBNoFrom
    if inAddrBNoTo == '': inAddrBNoTo = inAddrBNoFrom

    # check overlap between inAddrBNoFrom-To  and ogcioBNoFrom-To
    if (ogcioBNoTo < inAddrBNoFrom or ogcioBNoFrom > inAddrBNoTo):
        inAddrBNoSpan = None  # no overlap so set the matched span to none

    if 'BuildingNoFrom' in inDict:
        goodness = 1. if inAddrBNoFrom==ogcioBNoFrom else 0.5
        matches.append(('BuildingNoFrom', ogcioBNoFrom, inAddrBNoSpan, goodness))
    if 'BuildingNoTo' in inDict:
        goodness = 1. if inAddrBNoTo == ogcioBNoTo else 0.5
        matches.append(('BuildingNoTo', ogcioBNoTo, inAddrBNoSpan, goodness))

    return matches


def matchDict(inAddr, inDict):
    matches = []
    for (k, v) in inDict.items():
        #print (k,v)
        if k == 'ChiStreet':
            matches += matchChiStreetOrVillage(inAddr, v)
        elif k == 'ChiVillage':
            matches += matchChiStreetOrVillage(inAddr, v)
        elif type(v) == dict:
            matches += matchDict(inAddr, v)
        elif type(v) == str:
            matches += matchStr(inAddr, k, v)
        # Not printing any error here
        # else:
        #     print("Unhandled content: ", k, v)
    return matches


class Similarity:
    score = 0
    inAddr = ''
    inAddrHasMatch = []
    ogcioMatches = {}

    def __repr__(self):

        outStr = ''
        outStr += "query: %s\n" % self.inAddr

        tmp = "".join([ s if self.inAddrHasMatch[i] else '?' for (i,s) in enumerate(self.inAddr)])
        outStr += "match: %s\n" % tmp

        outStr += "ogcioMatches: %s\n"% self.ogcioMatches

        outStr += "Score: %s\n" % self.score

        return outStr

def getSimilarityWithOGCIO(inAddr, ogcioResult):
    """
    :param inAddr: a string of address
    :param ogcioResult: the "ChiPremisesAddress" of OGCIO query returned json
    :return:
    """

    matches = matchDict(inAddr, ogcioResult)
    #print (matches)

    inAddrHasMatch  = [False for i in range(len(inAddr))]
    score = 0

    scoreDict = {
        'Region' : 10,
        'StreetName' : 20,
        'VillageName': 20,
        'EstateName' : 20,
        'BuildingNoFrom': 30,
        'BuildingNoTo' :30,
        'BuildingName' : 40,
    }

    for (fieldName, fieldVal, matchSpan, goodness) in matches:
        if matchSpan==None:
            score-=1
            continue

        # if fieldName not in scoreDict:
        #     print("ignored ", fieldName, fieldVal)
        #     print(ogcioResult)

        score += scoreDict.get(fieldName,0) * goodness
        for i in range(matchSpan[0],matchSpan[1]) : inAddrHasMatch[i] = True


    s = Similarity()
    s.score = score
    s.inAddr = inAddr
    s.inAddrHasMatch = inAddrHasMatch
    s.ogcioMatches = matches

    return s