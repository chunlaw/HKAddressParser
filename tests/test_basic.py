from .context import Address

import unittest

class BasicTestSuite(unittest.TestCase):
  """Basic test cases."""

  def test_class_exists(self):
    assert Address

  def test_returning_some_address(self):
    ad = Address('禮頓道33號')
    assert ad._result
    ad.ParseAddress()
    assert ad._inputAddr
    assert ad._s


if __name__ == '__main__':
    unittest.main()