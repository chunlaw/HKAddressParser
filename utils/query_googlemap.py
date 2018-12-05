"""
Usage: python queryGoogleMap.py input.csv
"""

import googlemaps
from datetime import datetime
import sys
import pandas as pd


with open("./googleMapAPI.key","r") as f:
    key = f.readline()
    assert key!="", "No valid API key found"

qFile = "test.csv" if len(sys.argv)<2 else sys.argv[1]
df = pd.read_csv(qFile)
querys = df['address']

lats = []
lngs = []

gmaps = googlemaps.Client(key=key)

for query in querys:
    # Geocoding an address
    geocode_result = gmaps.geocode(query)
    lat,lng = (0.,0.)
    if len(geocode_result)>0:
        lat = geocode_result[0]['geometry']['location']['lat']
        lng = geocode_result[0]['geometry']['location']['lng']
    else:
        print ("ZERO_RESULT for %s"%query, file=sys.stderr)
    lats.append(lat)
    lngs.append(lng)
    print ("%s,%f,%f"%(query,lat,lng))

outdf = pd.DataFrame({'address' : querys,
                      'lat'     : lats,
                      'lng'     : lngs,
                      })

oFile = "test_googleRef.csv" if len(sys.argv)<3 else sys.argv[2]
outdf.to_csv(oFile, index=False)

