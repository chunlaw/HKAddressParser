const GA_CATEGORY_SINGLE_SEARCH = 'single_search';
const GA_CATEGORY_BATCH_SEARCH = 'batch_search';
const GA_ACTION_SEARCH = 'search';
const GA_ACTION_SEARCH_RESULT = 'search_result';
const GA_ACTION_SATISFICATION = 'rating';
const GA_ACTION_TOGGLE_FILTER = 'toogle_filter';


/**
 * Track the user has initialize a single search
 * @param {Component} component
 * @param {String} address
 */
export const trackSingleSearch = function(component, address) {
  component.$ga.event({
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: GA_ACTION_SEARCH,
    eventLabel: address
  })
}

/**
 * Track the user has initialize a single search
 * @param {Component} component
 * @param {String} address
 */
export const trackSingleSearchResult = function(component, address, score) {
  component.$ga.event({
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: GA_ACTION_SEARCH_RESULT,
    eventLabel: address,
    eventValue: score
  })
}

/**
 * TODO: user give us some rating
 * @param {Component} component
 * @param {*} address
 * @param {int} satisfication 1-100. 100 = satisfy
 */
export const trackSingleSearchSatisfication = function(component, address, satisfication) {
  component.$ga.event({
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
export const trackBatchSearch = function(component, addresses) {
  addresses.forEach(address => {
    component.$ga.event({
      eventCategory: GA_CATEGORY_BATCH_SEARCH,
      eventAction: GA_ACTION_SEARCH,
      eventLabel: address
    })
  });
}



export const trackToggleFilterOption = function(component, optionKey, isOn) {
  component.$ga.event({
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: GA_ACTION_TOGGLE_FILTER,
    eventLabel: optionKey,
    eventValue: isOn ? 1 : 0,
  })
}