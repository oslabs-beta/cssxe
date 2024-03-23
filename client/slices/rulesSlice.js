import { createSlice } from "@reduxjs/toolkit";

// regularRules are styles specified in .css files (origin=regular)
// inlineRules are styles specified directly on components (origin=inline)
// userAgentRules are default browser styles (origin=user-agent)
const initialState = {
  regularRules: [],
  inlineRules: [],
  userAgentRules: [],
  inheritedRules: [],
  keyframeRules: [],
  styleSheets: {},
  loaded: false, // if we want to track if styles have been loaded
  error: null, // if we want to track errors
  shortToLongMap: {},
  longToShortMap: {},
  isActiveCache: {},
};

const rulesSlice = createSlice({
  name: 'rules',
  initialState,
  reducers: {
    // every time user selects a DOM element, inline, regular, and user-agent rules are dispatched by the iFrameComp, updating the store via the reducers below.
    updateInlineRules: (state, action) => {
      // console.log('rulesSlice: state.inlineRules: updated', action.payload);
      state.inlineRules = action.payload;
    },
    updateRegularRules: (state, action) => {
      // console.log('rulesSlice: state.regularRules: updated', action.payload);
      state.regularRules = action.payload;
    },
    updateUserAgentRules: (state, action) => {
      // console.log('rulesSlice: state.userAgentRules: updated', action.payload);
      state.userAgentRules = action.payload;
    },
    updateInheritedRules: (state, action) => {
      // console.log('rulesSlice: state.inheritedRules: updated', action.payload);
      state.inheritedRules = action.payload;
    },
    updateKeyframeRules: (state, action) => {
      // console.log('rulesSlice: state.keyframeRules: updated', action.payload);
      state.keyframeRules = action.payload;
    },
    updateStyleSheets: (state, action) => {
      // console.log('rulesSlice: state.styleSheets: updated', action.payload);
      state.styleSheets = action.payload;
    },
    // iterates over shorthandEntries arr on all types of styles, builds: 
    // 1) mapping of each shorthand property to corresponding longhand properties and saves to shortToLongMap state;
    // 2) reverse mapping of each longhand property to its corresponding shorthand property and saves to longToShortMap state
    updateShortLongMaps: (state) => {
      const dummy = document.querySelector('#longhand-getter');

      const allStyles = [state.userAgentRules, state.regularRules, state.inlineRules];

      allStyles.forEach(array => {
        array.forEach(each => {
          for (let shortProp of each.rule.style.shorthandEntries) {
            // only add props to maps which have valid values and not add them again if they're already in the maps
            if (shortProp.value && !state.shortToLongMap[shortProp.name]) {
              // assign 1 shorthand property to a dummy DOM element
              dummy.style.setProperty(shortProp.name, shortProp.value);
              // get names of all longhand properties corresponding to the shorthand property
              const longhandProps = [...dummy.style];
              // for each shorthand, add all corresponding longhands to shortToLongMap state
              state.shortToLongMap[shortProp.name] = longhandProps;
              // for each longhand, add its shorthand property to longToShortMap state
              longhandProps.forEach(ls => {
                state.longToShortMap[ls] = shortProp.name;
              })
              // reset the dummy element for the next iteration
              dummy.style.removeProperty(shortProp.name);
            }
          }
        })
      })
    },
    // iterates over all types of styles and sets isActive flag only on the css properties which get rendered
    setIsActiveFlag: (state) => {
      const allStyles = [state.userAgentRules, state.regularRules, state.inlineRules];

      allStyles.forEach(array => {
        array.forEach(each => {
          // for user-agent styles, if shorthands are available they get rendered => add isActive for all shorthand properties first
          if (each.rule.origin === 'user-agent' && each.rule.style.shorthandEntries.length) {
            for (let shortStyle of each.rule.style.shorthandEntries) {
              if (shortStyle.value) shortStyle.isActive = true;
            }
          };

          for (let cssProperty of each.rule.style.cssProperties) {
            // for user-agent styles, only longhand properties which do not have corresponding shorthand properties get rendered. If property is in longToShortMap it means it was already added as a shorthand property
            if ((each.rule.origin === 'user-agent' && cssProperty.value && !state.longToShortMap[cssProperty.name]) ||
                // for regular and inline styles, add isActive only to user-defined properties (which have text property on them)
                (each.rule.origin === 'regular' && cssProperty.text) ||
                (each.rule.origin === 'inline' && cssProperty.text)) {
                  cssProperty.isActive = true;
                }
          }
        })
      });
    },
    findActiveStyles: (state) => {
      const cache = {};

      // for all types for styles, add the styles which have isActive property to cache
      state.userAgentRules.forEach(each => {
        const specificity = each.rule.selectorList.selectors[each.matchingSelectors[0]].specificity;
        const userAgentArrays = [each.rule.style.shorthandEntries, each.rule.style.cssProperties];
      
        userAgentArrays.forEach(userAgentArr => {
          for (let prop of userAgentArr) {
            if (prop.hasOwnProperty('isActive')) {
              if (!cache[prop.name]) cache[prop.name] = [];
              cache[prop.name].push({
                specificity,
                source: prop
              });            
            }
          }
        });
      });

      const regularAndInlineRules = [state.regularRules, state.inlineRules];

      regularAndInlineRules.forEach(array => {
        array.forEach(each => {
          let specificity;
          if (each.rule.origin === 'inline') {
            // temporarily hardcoded until researched how to set specificity for inline styles (CDP returns inline styles without specificity and per Chat GPT 'inline styles have inherently highest specificity')
            specificity = {
              "a": 9,
              "b": 9,
              "c": 9
            }
          } else specificity = each.rule.selectorList.selectors[each.matchingSelectors[0]].specificity;
  
          for (let cssProperty of each.rule.style.cssProperties) {
            if (cssProperty.hasOwnProperty('isActive')) {
              if (cssProperty.longhandProperties) {
                if (!cache[cssProperty.name]) cache[cssProperty.name] = [];
                cache[cssProperty.name].push({
                  specificity,
                  source: cssProperty
                }); 
              }
              else {
                if (state.longToShortMap[cssProperty.name]) {
                  const shortProp = state.longToShortMap[cssProperty.name];
                  if (!cache[shortProp]) cache[shortProp] = [];
                  cache[shortProp].push({
                    specificity,
                    source: cssProperty
                  });
                }
                else {
                  if (!cache[cssProperty.name]) cache[cssProperty.name] = [];
                  cache[cssProperty.name].push({
                    specificity,
                    source: cssProperty
                  }); 
                }
              }
            }
          }
        });
      });

      const compareSpecificity = (specificity1, specificity2) => {
        if (specificity1.a !== specificity2.a) {
          return specificity1.a > specificity2.a ? 1 : -1;
        }
        // If 'a' values are equal, compare the 'b' values
        if (specificity1.b !== specificity2.b) {
          return specificity1.b > specificity2.b ? 1 : -1;
        }
        // If 'b' values are equal, compare the 'c' values
        if (specificity1.c !== specificity2.c) {
          return specificity1.c > specificity2.c ? 1 : -1;
        }
        // If all values are equal, the specificities are equal
        return 0;
      };

      // go through cache and update isActive flag to false when needed
      for (let key in cache) {
        // if only 1 prop in array, it means there're no similar styles => no need to update isActive
        if (cache[key].length > 1) {
          let maxSpecificity = cache[key][0].specificity;
          let maxSource = cache[key][0].source;
          maxSource.isActive = true;

          for (let i = 1; i < cache[key].length; i++) {
            const item = cache[key][i];
            const result = compareSpecificity(maxSpecificity, item.specificity);

            // if 2 specificies are the same, the latter takes precedence
            if (result === -1 || result === 0) {
              maxSource.isActive = false;
              maxSpecificity = item.specificity;
              maxSource = item.source;
              maxSource.isActive = true;          
            }
            else if (result === 1) {
              item.source.isActive = false;
            }
          }
        }
      };

      state.isActiveCache = cache;
    },
  },
});

export const {
  updateInlineRules,
  updateRegularRules,
  updateUserAgentRules,
  updateInheritedRules,
  updateKeyframeRules,
  updateStyleSheets,
  findActiveStyles, 
  updateShortLongMaps, 
  setIsActiveFlag 
} = rulesSlice.actions;

export default rulesSlice.reducer;
