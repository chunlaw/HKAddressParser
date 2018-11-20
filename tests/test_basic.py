from .context import Address, Similarity

import unittest


class BasicTestSuite(unittest.TestCase):
    """Basic test cases."""

    def test_class_exists(self):
        assert Address

    def test_returning_some_address(self):
        ad = Address('禮頓道33號')
        assert ad._result
        result = ad.ParseAddress()
        # Should return formatted messages
        assert type(result['chi']) is dict
        assert type(result['eng']) is dict
        assert type(result['match']) is Similarity
        assert type(result['rank']) is int
        assert type(result['geo']) is list


if __name__ == '__main__':
    unittest.main()
