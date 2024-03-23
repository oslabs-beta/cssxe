import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import SidebarStyling from './SidebarStyling.jsx';

/* Styles included: default browser styles*/

function RulesUserAgentComp() {
    const userAgentRulesData = useSelector(state => state.rules.userAgentRules);
    const [longhandGetter, setLonghandGetter] = useState(null);
    let userAgentSelector;
    const userAgentRules = {};

    const ObjToArr = stylesObj => {
        const arr = [];
        for (let style in stylesObj) {
            arr.push({
                name: style,
                value: stylesObj[style].val,
                isActive: stylesObj[style].isActive
            })
        }
        return arr;
    };

    const removeDuplicates = (dummy, styleName, styleVal, stylesObj) => {
        // assign 1 shorthand property to a dummy DOM element
        dummy.style.setProperty(styleName, styleVal);
        // get names of all longhand properties corresponding to the shorthand property
        const longhandStyles = [...dummy.style];
        // delete duplicate longhand properties from userAgentRules obj
        longhandStyles.forEach(ls => {
            if (stylesObj[ls]) delete stylesObj[ls];
        });
        // reset the dummy element for the next iteration
        dummy.style.removeProperty(styleName);
    }

    // grab dummy DOM element for building shorthand-longhand css properties map
    useEffect(() => setLonghandGetter(document.querySelector('#longhand-getter')), []);

    if (longhandGetter) {
        userAgentRulesData.forEach(style => {
            // get only the first selector, because this is how it is in the chrome dev tools
            if (!userAgentSelector) userAgentSelector = style.rule.selectorList?.selectors[0].text;

            // add all longhand properties
            for (let cssProperty of style.rule.style.cssProperties) {
                if (cssProperty.value) {
                    userAgentRules[cssProperty.name] = {
                        val: cssProperty.value,
                        isActive: cssProperty.isActive
                    }
                }
            }
            const shorthandStyles = style.rule.style.shorthandEntries;
            if (shorthandStyles.length) {
                for (let shortStyle of shorthandStyles) {
                    // add all shorthand properties
                    if (shortStyle.value) {
                        userAgentRules[shortStyle.name] = {
                            val: shortStyle.value,
                            isActive: shortStyle.isActive
                        }
                    }
                    // get and remove longhand properties corresponding to each shorthand
                    removeDuplicates(longhandGetter, shortStyle.name, shortStyle.value, userAgentRules);
                }
            }
        })
    }

    return (
        <div>
        <h3>user agent</h3>
        {/* making this conditionally rendered as otherwise there is a bottom border where there's not one for inline and regular */}
            {Object.keys(userAgentRules).length > 0 &&
                <SidebarStyling
                    selector={userAgentSelector}
                    cssProperties={ObjToArr(userAgentRules)}
                    origin={'user-agent'}
                />
            }
        </div>
    )
};

export default RulesUserAgentComp;
