import pandas as pd
import addressParser as ap
import math

df = pd.read_csv('test.csv')
# df = df[:80]

chi_address = []
plat = []
plng = []
match_counts = []
coord_diff = []
correct = []


for index, row in df.iterrows():
    addr = row['address']
    lat = row['lat']
    lng = row['lng']

    ad = ap.Address(addr)
    result = ad.ParseAddress()
    print(index)
    print(result)
    chi_address.append(result['status'])
    plat.append(result['geo'][0]['Latitude'])
    plng.append(result['geo'][0]['Longitude'])
    match_counts.append(result['matched'])

    lat_diff = lat - float(result['geo'][0]['Latitude'])
    lng_diff = lng - float( result['geo'][0]['Longitude'])

    sqrt_diff = math.sqrt(math.pow(lat_diff, 2) + math.pow(lng_diff, 2))

    coord_diff.append(sqrt_diff)

    if sqrt_diff < 0.001:
        correct.append('Y')
    else:
        correct.append('N')
    


df['parsedAddress'] = chi_address
df['parsedlat'] = plat
df['parsedlng'] = plng
df['match_counts'] = match_counts
df['coord_diff'] = coord_diff
df['correct'] = correct


df.to_csv("result.csv")
print("-----------------------------------------------------------")
print("Number of input address: {}".format(len(df)))
print("Correct: {} | Percentage: {:.1%}".format(correct.count('Y'), correct.count('Y')/len(df)))
