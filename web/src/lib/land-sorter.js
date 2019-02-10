
const normalizeString = (str) => {
  return str.replace(/,/g, ' ')
}

export const sortLandResult = (searchString, landResults) => {
  const normalizeSearchString = normalizeString(searchString);
  const container = landResults.map(
    landAddress => ({
      landAddress,
      lcs: Math.max(
        lcs(normalizeSearchString, normalizeString(landAddress.fullAddress('chi'))),
        lcs(normalizeSearchString, normalizeString(landAddress.fullAddress('eng')))
        ),
    })
  );

  container.sort( (a, b) => b.lcs - a.lcs);

  return container.map(c => c.landAddress);
}

export const lcs = (str1, str2) => {
  const m = str1.length + 1;
  const n = str2.length + 1;

  const lcsTable = new Array(m);
  for (let i = 0; i < m; i++) {
    lcsTable[i] = new Array(n);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 || j === 0) {
        lcsTable[i][j] = 0;
      } else if (str1[i] === str2[j]) {
        lcsTable[i][j] = 1 + lcsTable[i - 1][j - 1];
      } else {
        lcsTable[i][j] = Math.max(lcsTable[i - 1][j], lcsTable[i][j - 1]);
      }
    }
  }
  return lcsTable[m - 1][n - 1];


}