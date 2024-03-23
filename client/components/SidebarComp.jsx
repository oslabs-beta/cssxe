import React, { useState, useEffect } from 'react';
import RulesAllComp from "./RulesAllComp.jsx";

function SidebarComp() {
  // local state variable for toggling the sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggling the sidebar visibility when the user presses Shift + Enter
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey && event.key === 'Enter') {
        console.log('Shift + Enter pressed. Toggling sidebar visibility.');

    // The `setIsCollapsed` function is used to update the state.
    // The `prevCollapsed` parameter is the previous value of `isCollapsed`.
    // The `!prevCollapsed` - the negation of the prior value of this state variable - is the new value of `isCollapsed`.
    // In other words, this function toggles the value of `isCollapsed`.
    // 'functional update' of state:
    // This pattern in React and ensures that the state is always updated correctly, even when multiple calls are made in quick succession.
    setIsCollapsed((prevCollapsed) => !prevCollapsed);
      }
    };

    // Adding the event listener to the window
    window.addEventListener('keydown', handleKeyDown);

    // Cleaning up the event listener when the component unmounts.
    // React runs this later, after the component is removed from the DOM.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // not passing any dependencies, as we only want to add the event listener once.
    // if we did pass dependencies, the effect would run every time one of them changes
    // -> it would first run the cleanup function, and then add the event listener again.
  }, []);

  return (

    // if isCollapsed is true, the sidebar-container and the sidebar will be collapsed
    <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <h2 style={{ textAlign: 'center'}}>Styles</h2>
        <RulesAllComp />
      </div>
      <button className="collapse-button" onClick={() => setIsCollapsed(!isCollapsed)}>
        {/* if isCollapsed is true, the button text will be '>', otherwise it will be '<'
         */}
        {isCollapsed ? '>' : '<'}
      </button>
    </div>

  );
}

export default SidebarComp;
