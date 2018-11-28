# Print the result in the desired format
import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python')))

from components.core import Address
from components.util import Similarity

try:
  ad = Address(sys.argv[1])
  result = ad.ParseAddress()
  output = {}
  output['chi'] = result['chi']
  output['eng'] = result['eng']
  output['geo'] = result['geo']
  print(json.dumps(output))
except:
  print("{}")