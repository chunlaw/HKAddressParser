const GA_CATEGORY_MAP_SEARCH = 'map_search';
const GA_CATEGORY_TABLE_SEARCH = 'table_search';
const GA_ACTION_SEARCH = 'search';
const GA_ACTION_SEARCH_SATISFIED = 'search_satisfied';
const GA_ACTION_SEARCH_UNSATISFIED = 'search_unsatisfied';
const GA_ACTION_DOWNLOAD_CSV = 'download_csv';
const GA_ACTION_SELECT_PIN = 'select_pin';
const GA_ACTION_SATISFICATION = 'rating';
const GA_ACTION_TOGGLE_FILTER = 'toogle_filter';


function trackEvent(component, param) {
  if (component.$ga) {
    component.$ga.event(param);
  } else {
    // do nothing if GA is not set up
  }
}

/**
 * Track the user has initialize a single search
 * @param {Component} component
 * @param {String} address
 */
export const trackMapSearch = function (component, searchSize) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_MAP_SEARCH,
    eventAction: GA_ACTION_SEARCH,
    eventValue: searchSize
  })
}

/**
 * Track the user has selected the pin in map mode
 * @param {*} component
 * @param {*} address
 */
export const trackPinSelected = function (component, address) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_MAP_SEARCH,
    eventAction: GA_ACTION_SELECT_PIN,
    eventLabel: address
  })
}

/**
 * TODO: user give us some rating
 * @param {Component} component
 * @param {*} address
 * @param {int} satisfication 1-100. 100 = satisfy
 */
export const trackSingleSearchSatisfication = function (component, address, satisfication) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: GA_ACTION_SATISFICATION,
    eventLabel: address
  })
}

/**
 * Track the user has initialize a batch search
 * @param {*} component
 * @param {*} addresses
 */
export const trackTableSearch = function (component, batchSize) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_TABLE_SEARCH,
    eventAction: GA_ACTION_SEARCH,
    eventValue: batchSize
  })
}

/**
 * Track the user has clicked on the download button
 * @param {*} component
 * @param {*} batchSize
 */
export const trackDownloadCSV = function (component, batchSize) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_TABLE_SEARCH,
    eventAction: GA_ACTION_DOWNLOAD_CSV,
    eventValue: batchSize
  })
}



export const trackToggleFilterOption = function (component, optionKey, isOn) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: GA_ACTION_TOGGLE_FILTER,
    eventLabel: optionKey,
    eventValue: isOn ? 1 : 0,
  })
}


/**
 * Track the user has initialize a single search
 * @param {Component} component
 * @param {String} address
 */
export const trackSingleSearchSatisfied = function (component, address, satisfied) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: satisfied ? GA_ACTION_SEARCH_SATISFIED : GA_ACTION_SEARCH_UNSATISFIED,
    eventLabel: address
  })
}