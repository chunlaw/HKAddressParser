const region = {
  HK: {
    eng: "Hong Kong",
    chi: "香港"
  },
  KLN: {
    eng: "Kowloon",
    chi: "九龍"
  },
  NT: {
    eng: "New Territories",
    chi: "新界"
  }
};

const dcDistrict = {
  invalid: {
    eng: "Invalid District Name",
    chi: "無效地區"
  },
  CW: {
    eng: "Central and Western District",
    chi: "中西區"
  },
  EST: {
    eng: "Eastern District",
    chi: "東區"
  },
  ILD: {
    eng: "Islands District",
    chi: "離島區"
  },
  KLC: {
    eng: "Kowloon City District",
    chi: "九龍城區"
  },
  KC: {
    eng: "Kwai Tsing District",
    chi: "葵青區"
  },
  KT: {
    eng: "Kwun Tong District",
    chi: "觀塘區"
  },
  NTH: {
    eng: "North District",
    chi: "北區"
  },
  SK: {
    eng: "Sai Kung District",
    chi: "西貢區"
  },
  ST: {
    eng: "Sha Tin Distric",
    chi: "沙田區"
  },
  SSP: {
    eng: "Sham Shui Po District",
    chi: "深水埗區"
  },
  STH: {
    eng: "Southern District",
    chi: "南區"
  },
  TP: {
    eng: "Tai Po District",
    chi: "大埔區"
  },
  TW: {
    eng: "Tsuen Wan District",
    chi: "荃灣區"
  },
  TM: {
    eng: "Tuen Mun District",
    chi: "屯門區"
  },
  WC: {
    eng: "Wan Chai District",
    chi: "灣仔區"
  },
  WTS: {
    eng: "Wong Tai Sin District",
    chi: "黃大仙區"
  },
  YTM: {
    eng: "Yau Tsim Mong District",
    chi: "油尖旺區"
  },
  YL: {
    eng: "Yuen Long District",
    chi: "元朗區"
  }
};

// MUST use common js style to let address-parse "require" work normally
module.exports = {
  region,
  dcDistrict
};
