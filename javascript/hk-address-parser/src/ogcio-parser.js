/**
 * To parse the address from OGCIO. this file should be compatible with node.js and js running in browser
 *
 */

import { region, dcDistrict } from "./utils/constants";

const CONFIDENT_ALL_MATCH = 1.0;
const CONFIDENT_MULTIPLIER_NAME_ONLY = 0.5;
const CONFIDENT_MULTIPLIER_PARTIAL_MATCH = 0.7;
const CONFIDENT_MULTIPLIER_OPPOSITE_STREET = 0.75;
const CONFIDENT_MULTIPLIER_FULL_STREET_MATCH = 1.5;

const CONFIDENT_REVERSE_MATCH = 0.9;

const OGCIO_KEY_BLOCK = "Block";
const OGCIO_KEY_PHASE = "Phase";
const OGCIO_KEY_ESTATE = "Estate";
const OGCIO_KEY_VILLAGE = "Village";
const OGCIO_KEY_STREET = "Street";
const OGCIO_KEY_REGION = "Region";
const OGCIO_KEY_BUILDING_NAME = "BuildingName";

const SCORE_SCHEME = {
    [OGCIO_KEY_BUILDING_NAME]: 50,
    [OGCIO_KEY_VILLAGE]: 40,
    [OGCIO_KEY_ESTATE]: 40,
    [OGCIO_KEY_STREET]: 40,
    [OGCIO_KEY_REGION]: 20,
    [OGCIO_KEY_PHASE]: 20,
    [OGCIO_KEY_BLOCK]: 20,
};

const SCORE_PER_MATCHED_CHAR = 0.1;

// priority in asscending order
const elementPriority = [
    OGCIO_KEY_BUILDING_NAME,
    OGCIO_KEY_BLOCK,
    OGCIO_KEY_PHASE,
    OGCIO_KEY_ESTATE,
    OGCIO_KEY_VILLAGE,
    OGCIO_KEY_STREET,
    OGCIO_KEY_REGION
];

const log = console.log; // eslint-disable-line

class Match {
    constructor(confident, matchedKey, matchedWords) {
        this.confident = confident;
        this.matchedKey = matchedKey;
        // array of words that matched
        this.matchedWords = matchedWords;
    }
}




function removeFloor(address) {
    return address.replace(/([0-9A-z\-\s]+[樓層]|[0-9A-z號\-\s]+[舖鋪]|地[下庫]|平台).*/g, '');
}


function dcDistrictMapping(val, isChinese) {
    for (const district in dcDistrict) {
        if (district === val) {
            return isChinese ? dcDistrict[district].chi : dcDistrict[district].eng;
        }
    }
    return isChinese ? dcDistrict.invalid.chi : dcDistrict.invalid.eng;
}

function regionMapping(val) {
    for (const reg in region) {
        if (reg === val) {
            return region[reg].eng;
        }
    }
}


/**
 * Return the percentage of how much do the laterString match the first one
 * @param {*} string
 * @param {*} stringToSearch
 */
function findPartialMatch(string, stringToSearch) {
    const match = {
        matchPercentage: 0,
        matchedWord: null
    };

    // some exceptional case if the word from OGCIO contains directly the search address, we consider it as a full match
    if (stringToSearch.indexOf(string) >= 0) {
        match.matchPercentage = 0.9;
        match.matchedWord = string;
    } else {
        masterLoop:
            for (let i = 0; i < stringToSearch.length; i ++) {
                for (let end = stringToSearch.length; end > i; end --) {
                    const substring = stringToSearch.substring(i, end);
                    if (string.includes(substring)) {
                        match.matchPercentage = (substring.length * 1.0 / stringToSearch.length);
                        match.matchedWord = substring;
                        break masterLoop;
                    }
                }
            }
    }

    return match;
}

/**
 * Remove the top level "Eng"/"Chi" prefix of the addresses
 * @param {*} data
 */
function eliminateLangKeys(data) {
    const result = {};
    for (const key of Object.keys(data)) {
        const refinedKey = key.replace(/(^Chi|^Eng)/,'');
        // eliminate with recursion
        if (typeof(data[key]) === "object") {
            result[refinedKey] = eliminateLangKeys(data[key]);
        } else {
            result[refinedKey] = data[key];
        }

    }
    return result;
}

function normalizeResponse(responseFromOGCIO) {
    // No more flatten json to maintain the orginal data structure
    // https://www.als.ogcio.gov.hk/docs/Data_Dictionary_for_ALS_EN.pdf
    return responseFromOGCIO.SuggestedAddress.map(record => ({
        chi: eliminateLangKeys(record.Address.PremisesAddress.ChiPremisesAddress),
        eng: eliminateLangKeys(record.Address.PremisesAddress.EngPremisesAddress),
        geo: record.Address.PremisesAddress.GeospatialInformation,
    }));
}

function tryToMatchAnyNumber(address, number) {
    const matches = address.match(/\d+/g);
    if (matches === null) {
        return false;
    }

    for (const match of matches) {
        const num = parseInt(match, 10);
        if (num === number) {
            return true;
        }
    }
    return false;
}

function tryToMatchRangeOfNumber(address, from, to, isOdd) {
    const matches = address.match(/\d+/g);
    if (matches === null) {
        return false;
    }

    for (const match of matches) {
        const num = parseInt(match, 10);
        if (num >= from && num <= to && ((num % 2 === 1) === isOdd)) {
            return true;
        }
    }
    return false;
}

function isChinese(s) {
    return /[^\u0000-\u00ff]/.test(s);
}

function splitValueForSpaceIfChinese(value) {
    if (isChinese(value) && /\s/.test(value)) {
        const tokens = value.split(/\s/);
        // we need the last element only
        return tokens[tokens.length - 1];
    }
    return value;
}


function matchAllMatchedWords(address, matchedWords) {
    return matchedWords.map(word => address.includes(word)).reduce((p,c) => p && c, true);
}
/**
 * Find the longest set of matches that has highest score and not overlapping
 * @param {*} address
 * @param {*} matches
 */
function findMaximumNonOverlappingMatches(address, matches) {
    if (matches.length === 1) {
        if (matches[0].matchedWord !== null && matchAllMatchedWords(address, matches[0].matchedWords)) {
            return matches;
        }
        return [];
    }

    let longestMatchScore = 0;
    let longestMatch = [];
    for (const match of matches) {
        if (matchAllMatchedWords(address, match.matchedWords)) {
            let subAddress = address;
            match.matchedWords.forEach(word => subAddress = subAddress.replace(word, ''));
            const localLongestMatch = findMaximumNonOverlappingMatches(subAddress, matches.filter(m => m.matchedKey !== match.matchedKey));
            localLongestMatch.push(match);
            const score = calculateScoreFromMatches(localLongestMatch);
            if (score > longestMatchScore) {
                longestMatchScore = score;
                longestMatch = localLongestMatch;
            }
        }
    }
    return longestMatch;
}

/**
 * To calcutate the final confident with partical match
 * @param {*} confident
 * @param {*} matchPercentage
 */
function modifyConfidentByPartialMatchPercentage(confident, matchPercentage) {
    return confident * matchPercentage * matchPercentage * CONFIDENT_MULTIPLIER_PARTIAL_MATCH;
}


function calculateScoreFromMatches(matches) {
    let score = 0;
    for (const match of matches) {
        score += SCORE_SCHEME[match.matchedKey] * match.confident;
    }
    return score;
}

function searchSimilarityForStreetOrVillage(type, address, addressToSearch, BuildingNoFrom, BuildingNoTo) {
    const sim = new Match(0, type, []);
    if (address.includes(addressToSearch)) {
        sim.confident = CONFIDENT_ALL_MATCH;
        sim.matchedWords.push(addressToSearch);
    } else {
        const { matchPercentage, matchedWord } = findPartialMatch(address, addressToSearch);
        if (matchPercentage > 0) {
            sim.confident = modifyConfidentByPartialMatchPercentage(CONFIDENT_ALL_MATCH, matchPercentage);
            sim.matchedWords.push(matchedWord);
        }
    }
    // total match of the streetname
    if (BuildingNoFrom) {
        const from = parseInt(BuildingNoFrom, 10);
        const to = BuildingNoTo ? parseInt(BuildingNoTo, 10) : from;
        const isOdd = parseInt(BuildingNoFrom, 10) % 2 === 1;
        // If the street name and also the street no. is matched. we should give it a very high score
        if (from === to) {
            if (!tryToMatchAnyNumber(address, from)) {
                if (tryToMatchRangeOfNumber(address, from, to, !isOdd)) {
                    // ratio 1
                    sim.confident *= CONFIDENT_MULTIPLIER_OPPOSITE_STREET;
                } else {
                    sim.confident *= CONFIDENT_MULTIPLIER_NAME_ONLY;
                }
            } else {
                sim.matchedWords.push(from + '');
                sim.confident *= CONFIDENT_MULTIPLIER_FULL_STREET_MATCH;
            }
        } else {
            if (!tryToMatchRangeOfNumber(address, from, to, isOdd)) {
                // Try to look up at opposite street
                if (tryToMatchRangeOfNumber(address, from, to, !isOdd)) {
                    // ratio 1
                    sim.confident *= CONFIDENT_MULTIPLIER_OPPOSITE_STREET;
                } else {
                    sim.confident *= CONFIDENT_MULTIPLIER_NAME_ONLY;
                }
            } else {
                // TODO: cannot mark the street/village number that we have came across
                sim.confident *= CONFIDENT_MULTIPLIER_FULL_STREET_MATCH;
            }
        }
    } else {
        sim.confident *= CONFIDENT_MULTIPLIER_NAME_ONLY;
    }
    return sim;
}

function searchOccuranceForBlock(address, { BlockDescriptor, BlockNo}) {
    if (address.includes(BlockNo + BlockDescriptor)) {
        const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BLOCK, [BlockNo, BlockDescriptor]);
        if (BlockNo) {
            if (!tryToMatchAnyNumber(address, parseInt(BlockNo, 10))) {
                match.confident = CONFIDENT_MULTIPLIER_NAME_ONLY;
            }
        }
        return match;
    }
    return null;
}

function searchOccuranceForPhase(address, { PhaseNo, PhaseName}) {
    if (address.includes(PhaseName + PhaseNo)) {
        const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_PHASE, [PhaseNo, PhaseName]);
        if (PhaseNo) {
            if (!tryToMatchAnyNumber(address, parseInt(PhaseNo, 10))) {
                match.confident = CONFIDENT_MULTIPLIER_NAME_ONLY;
            }
        }
        return match;
    }
    return null;
}

function searchOccuranceForEstate(address, { EstateName }) {
    if (address.includes(EstateName)) {
        return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_ESTATE, [EstateName]);
    }
    return null;
}

function searchOccuranceForRegion(address, region) {
    if (address.includes(region)) {
        return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_REGION, [region]);
    }
    return null;
}

function searchOccuranceForBuildingName(address, buildingName) {
    if (address.includes(buildingName)) {
        return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BUILDING_NAME, [buildingName]);
    } else {
        const { matchPercentage, matchedWord } = findPartialMatch(address, buildingName);
        if (matchPercentage > 0) {
            const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BUILDING_NAME, [matchedWord]);
            match.confident = modifyConfidentByPartialMatchPercentage(match.confident, matchPercentage);
            return match;
        }
    }
    return null;
}

function searchOccuranceForStreet(address, {StreetName, BuildingNoFrom, BuildingNoTo}) {
    const streetsToTest = splitValueForSpaceIfChinese(StreetName);
    return searchSimilarityForStreetOrVillage(OGCIO_KEY_STREET, address, streetsToTest, BuildingNoFrom, BuildingNoTo);
}

function searchOccuranceForVillage(address, {VillageName, BuildingNoFrom, BuildingNoTo}) {
    const streetsToTest = splitValueForSpaceIfChinese(VillageName);
    return searchSimilarityForStreetOrVillage(OGCIO_KEY_VILLAGE, address, streetsToTest, BuildingNoFrom, BuildingNoTo);
}

/**
 * Take a
 */
function searchOccurance(address, ogcioRecordElementKey, ogcioRecordElement) {
    switch (ogcioRecordElementKey) {
        case OGCIO_KEY_STREET:  return searchOccuranceForStreet(address, ogcioRecordElement); break;
        case OGCIO_KEY_VILLAGE: return searchOccuranceForVillage(address, ogcioRecordElement); break;
        case OGCIO_KEY_BLOCK:   return searchOccuranceForBlock(address, ogcioRecordElement); break;
        case OGCIO_KEY_PHASE:   return searchOccuranceForPhase(address, ogcioRecordElement); break;
        case OGCIO_KEY_ESTATE:  return searchOccuranceForEstate(address, ogcioRecordElement); break;
        case OGCIO_KEY_REGION:  return searchOccuranceForRegion(address, ogcioRecordElement); break;
        case OGCIO_KEY_BUILDING_NAME:   return searchOccuranceForBuildingName(address, ogcioRecordElement); break;
    }
    return null;
}

function findMatchFromOGCIORecord(address, ogcioRecord) {
    const matches = [];

    // First we look up everything that exists in that address
    for (const key of elementPriority) {
        if (ogcioRecord.chi[key] !== undefined && isChinese(address)) {
            //
            const occurance = searchOccurance(address, key, ogcioRecord.chi[key]);

            if (occurance === null) {
                continue;
            }
            matches.push(occurance);
        }

        if (ogcioRecord.eng[key] !== undefined && !isChinese(address)) {
            const occurance = searchOccurance(address, key, ogcioRecord.eng[key]);
            if (occurance === null) {
                continue;
            }
            matches.push(occurance);
        }
    }
    return findMaximumNonOverlappingMatches(address, matches);
}

function transformDistrict(ogcioRecord) {
    if (ogcioRecord.eng.District) {
        ogcioRecord.eng.District.DcDistrict = dcDistrictMapping(ogcioRecord.eng.District.DcDistrict, false);
    }
    if (ogcioRecord.chi.District) {
        ogcioRecord.chi.District.DcDistrict = dcDistrictMapping(ogcioRecord.chi.District.DcDistrict, true);
    }

    if (ogcioRecord.eng.Region) {
        ogcioRecord.eng.Region = regionMapping(ogcioRecord.eng.Region);
    }
    return ogcioRecord;
}

function parseAddress(address, normalizedOGCIOResult) {
    for (let record of normalizedOGCIOResult) {
        const matches = findMatchFromOGCIORecord(address, record);
        record.score = calculateScoreFromMatches(matches);
        record.matches = matches;
        // Also tranform the district code to name directly
        record = transformDistrict(record);
    }

    normalizedOGCIOResult = normalizedOGCIOResult.sort((a, b) => {
        return b.score - a.score;
    });
    return (normalizedOGCIOResult.slice(0, 200));
}


/**
 * Standalone version of address parsing.
 * @param {*} address
 * @param {*} responseFromOGCIO Raw json response from ogcio
 */
function searchResult(address, responseFromOGCIO) {
    const normalizedAddress = removeFloor(address).toUpperCase();
    const normalizedOGCIOResult = normalizeResponse(responseFromOGCIO);
    return parseAddress(normalizedAddress, normalizedOGCIOResult);
}

export default {
    searchResult,
    calculateScoreFromMatches
}
