import pandas as pd
import addressParser as ap
import math


def haversine(latlng1, latlng2):
    """
    :param latlng1:
    tuple of (lat,lng)
    :param latlng2:
    tuple of (lat,lng)
    latitude longitude are in degrees eg (22.3, 114.2)
    :return:
    distance in km between the two points
    Ref:
    https://www.movable-type.co.uk/scripts/latlong.html
    """
    lat1, lng1 = latlng1
    lat2, lng2 = latlng2
    R = 6371  # earth radius km
    pi = 3.141592658
    phi1 = lat1 / 180. * pi
    phi2 = lat2 / 180. * pi
    dphi = phi1 - phi2
    dlambda = (lng1 - lng2) / 180. * pi
    a = math.pow(math.sin(dphi / 2.), 2) + math.cos(phi1) * math.cos(phi2) * math.pow(math.sin(dlambda / 2.), 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = R * c
    return d


df = pd.read_csv('test.csv')
# df = df[:80]

chi_address = []
plat = []
plng = []
match_counts = []
coord_diff = []
correct = []
rank = []

for index, row in df.iterrows():
    addr = row['address']
    lat = row['lat']
    lng = row['lng']

    ad = ap.Address(addr)
    result = ad.ParseAddress()
    print(index)
    print(result)
    chi_address.append(result['match'].ogcioMatches)
    tmplat = 0.
    tmplng = 0.
    cnt = 0.
    for aPoint in result['geo']:
        tmplat += float(aPoint['Latitude'])
        tmplng += float(aPoint['Longitude'])
        cnt+=1
    tmplat /= cnt
    tmplng /= cnt

    plat.append(tmplat)
    plng.append(tmplng)
    match_counts.append(result['match'].score)

    lat_diff = lat - tmplat
    lng_diff = lng - tmplng

    sqrt_diff = math.sqrt(math.pow(lat_diff, 2) + math.pow(lng_diff, 2))


    distance = haversine( (lat,lng), (tmplat, tmplng))
    coord_diff.append(distance)

    if distance <0.1: # km  previous ver use sqrt_diff < 0.001 i.e. ~0.105km
        correct.append('Y')
    else:
        correct.append('N')

    rank.append( ad._result[0]['rank'])


df['parsedAddress'] = chi_address
df['parsedlat'] = plat
df['parsedlng'] = plng
df['match_counts'] = match_counts
df['coord_diff'] = coord_diff
df['correct'] = correct
df['rank'] = rank


df.to_csv("result.csv")
print("-----------------------------------------------------------")
print("Number of input address: {}".format(len(df)))
print("Correct: {} | Percentage: {:.1%}".format(correct.count('Y'), correct.count('Y')/len(df)))
