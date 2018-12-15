const GA_CATEGORY_SINGLE_SEARCH = 'single_search';
const GA_CATEGORY_BATCH_SEARCH = 'batch_search';
const GA_ACTION_SEARCH = 'search';
const GA_ACTION_SEARCH_SATISFIED = 'search_satisfied';
const GA_ACTION_SEARCH_UNSATISFIED = 'search_unsatisfied';
const GA_ACTION_SEARCH_RESULT = 'search_result';
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
export const trackSingleSearch = function (component, address) {
  trackEvent(component, {
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
export const trackSingleSearchResult = function (component, address, score) {
  trackEvent(component, {
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
export const trackBatchSearch = function (component, addresses) {
  addresses.forEach(address => {
    trackEvent(component, {
      eventCategory: GA_CATEGORY_BATCH_SEARCH,
      eventAction: GA_ACTION_SEARCH,
      eventLabel: address
    })
  });
}



/**
 * Track the batch search result
 * @param {Component} component
 * @param {String} address
 */
export const trackBatchSearchResult = function (component, address, score) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_BATCH_SEARCH,
    eventAction: GA_ACTION_SEARCH_RESULT,
    eventLabel: address,
    eventValue: score
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