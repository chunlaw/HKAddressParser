"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.trackSingleSearchSatisfied = exports.trackToggleFilterOption = exports.trackDownloadCSV = exports.trackTableSearch = exports.trackSingleSearchSatisfication = exports.trackPinSelected = exports.trackMapSearch = void 0;
var GA_CATEGORY_MAP_SEARCH = 'map_search';
var GA_CATEGORY_TABLE_SEARCH = 'table_search';
var GA_ACTION_SEARCH = 'search';
var GA_ACTION_SEARCH_SATISFIED = 'search_satisfied';
var GA_ACTION_SEARCH_UNSATISFIED = 'search_unsatisfied';
var GA_ACTION_DOWNLOAD_CSV = 'download_csv';
var GA_ACTION_SELECT_PIN = 'select_pin';
var GA_ACTION_SATISFICATION = 'rating';
var GA_ACTION_TOGGLE_FILTER = 'toogle_filter';

function trackEvent(component, param) {
  if (component.$ga) {
    component.$ga.event(param);
  } else {// do nothing if GA is not set up
  }
}
/**
 * Track the user has initialize a single search
 * @param {Component} component
 * @param {String} address
 */


var trackMapSearch = function trackMapSearch(component, searchSize) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_MAP_SEARCH,
    eventAction: GA_ACTION_SEARCH,
    eventValue: searchSize
  });
};
/**
 * Track the user has selected the pin in map mode
 * @param {*} component
 * @param {*} address
 */


exports.trackMapSearch = trackMapSearch;

var trackPinSelected = function trackPinSelected(component, address) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_MAP_SEARCH,
    eventAction: GA_ACTION_SELECT_PIN,
    eventLabel: address
  });
};
/**
 * TODO: user give us some rating
 * @param {Component} component
 * @param {*} address
 * @param {int} satisfication 1-100. 100 = satisfy
 */


exports.trackPinSelected = trackPinSelected;

var trackSingleSearchSatisfication = function trackSingleSearchSatisfication(component, address, satisfication) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: GA_ACTION_SATISFICATION,
    eventLabel: address
  });
};
/**
 * Track the user has initialize a batch search
 * @param {*} component
 * @param {*} addresses
 */


exports.trackSingleSearchSatisfication = trackSingleSearchSatisfication;

var trackTableSearch = function trackTableSearch(component, batchSize) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_TABLE_SEARCH,
    eventAction: GA_ACTION_SEARCH,
    eventValue: batchSize
  });
};
/**
 * Track the user has clicked on the download button
 * @param {*} component
 * @param {*} batchSize
 */


exports.trackTableSearch = trackTableSearch;

var trackDownloadCSV = function trackDownloadCSV(component, batchSize) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_TABLE_SEARCH,
    eventAction: GA_ACTION_DOWNLOAD_CSV,
    eventValue: batchSize
  });
};

exports.trackDownloadCSV = trackDownloadCSV;

var trackToggleFilterOption = function trackToggleFilterOption(component, optionKey, isOn) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: GA_ACTION_TOGGLE_FILTER,
    eventLabel: optionKey,
    eventValue: isOn ? 1 : 0
  });
};
/**
 * Track the user has initialize a single search
 * @param {Component} component
 * @param {String} address
 */


exports.trackToggleFilterOption = trackToggleFilterOption;

var trackSingleSearchSatisfied = function trackSingleSearchSatisfied(component, address, satisfied) {
  trackEvent(component, {
    eventCategory: GA_CATEGORY_SINGLE_SEARCH,
    eventAction: satisfied ? GA_ACTION_SEARCH_SATISFIED : GA_ACTION_SEARCH_UNSATISFIED,
    eventLabel: address
  });
};

exports.trackSingleSearchSatisfied = trackSingleSearchSatisfied;