# Bug Sheet & Test Plan

## Identified Bugs/Limitations

1.  **Missing Warning Event Listener (FIXED)**
    *   **Description:** The "Warning" button in `index.html` did not have an event listener in `script.js` to trigger a toast.
    *   **Status:** Fixed. An event listener has been added.

2.  **Single Toast Limitation (FIXED)**
    *   **Description:** The system could only display one toast at a time. Triggering a new toast would remove any existing toast.
    *   **Status:** Fixed. The code has been modified to allow multiple toasts to be displayed simultaneously in a stacked manner.

3.  **Potential Accessibility Issue: Keyboard Navigation for Closing Toasts**
    *   **Description:** Toasts currently disappear automatically. There's no explicit way to close them using a keyboard (e.g., an 'x' button within the toast that can be focused and activated).
    *   **Status:** Open. This is an enhancement suggestion.

4.  **Potential Accessibility Issue: ARIA Attributes**
    *   **Description:** Toasts are dynamic content. ARIA attributes (e.g., `role="alert"`, `aria-live`) should be used to ensure screen readers announce toasts effectively. The current implementation does not include these.
    *   **Status:** Open. This is an enhancement suggestion.

## Test Plan

### 1. Individual Toast Functionality

*   **Test Case 1.1: Success Toast**
    *   **Action:** Click the "Submit" button.
    *   **Expected Result:**
        *   A success toast appears in the top-right corner.
        *   The toast displays the message "Article Submitted Successfully".
        *   The toast has the correct success icon and green styling.
        *   The progress bar animates for the specified duration (default 5s).
        *   The toast slides in and fades out correctly after 5 seconds.

*   **Test Case 1.2: Danger Toast**
    *   **Action:** Click the "Failed" button.
    *   **Expected Result:**
        *   A danger toast appears in the top-right corner.
        *   The toast displays the message "Failed unexpected error".
        *   The toast has the correct danger icon and red styling.
        *   The progress bar animates for the specified duration (default 5s).
        *   The toast slides in and fades out correctly after 5 seconds.

*   **Test Case 1.3: Info Toast**
    *   **Action:** Click the "Information" button.
    *   **Expected Result:**
        *   An info toast appears in the top-right corner.
        *   The toast displays the message "Do POTD and Earn Coins".
        *   The toast has the correct info icon and blue styling.
        *   The progress bar animates for the specified duration (default 5s).
        *   The toast slides in and fades out correctly after 5 seconds.

*   **Test Case 1.4: Warning Toast**
    *   **Action:** Click the "Warning" button.
    *   **Expected Result:**
        *   A warning toast appears in the top-right corner.
        *   The toast displays the message "Please be cautious!".
        *   The toast has the correct warning icon and yellow styling.
        *   The progress bar animates for the specified duration (default 5s).
        *   The toast slides in and fades out correctly after 5 seconds.

### 2. Multiple Toasts Functionality (Post-Fix)

*   **Test Case 2.1: Rapidly Trigger Multiple Toasts**
    *   **Action:** Click several different toast buttons (e.g., Success, then Info, then Warning) in quick succession (within 1-2 seconds of each other).
    *   **Expected Result:**
        *   Multiple toasts appear stacked vertically in the top-right corner, with the most recent toast at the top.
        *   Each toast displays its correct message, icon, and styling.
        *   Each toast has its own progress bar and disappears independently after its respective duration.
        *   Toasts are spaced out appropriately (due to `gap` in the container).

*   **Test Case 2.2: Trigger Same Toast Multiple Times**
    *   **Action:** Click the "Info" button three times in quick succession.
    *   **Expected Result:**
        *   Three info toasts appear stacked vertically.
        *   All toasts display the "Do POTD and Earn Coins" message and info styling.
        *   Each toast disappears independently after 5 seconds.

### 3. Toast Behavior

*   **Test Case 3.1: Custom Message and Duration (via console)**
    *   **Action:**
        1. Open the browser's developer console.
        2. Execute `showToast("Custom test message", "success", 2000);`
        3. Execute `showToast("Another custom message", "info", 7000);`
    *   **Expected Result:**
        *   The first toast appears with "Custom test message", success styling, and disappears after 2 seconds.
        *   The second toast appears with "Another custom message", info styling, and disappears after 7 seconds.
        *   Both toasts are displayed correctly if triggered close together.

*   **Test Case 3.2: Invalid Toast Type (via console)**
    *   **Action:**
        1. Open the browser's developer console.
        2. Execute `showToast("Invalid type test", "invalidtype", 3000);`
    *   **Expected Result:**
        *   A toast appears with the message "Invalid type test".
        *   The toast defaults to "info" styling (icon, colors).
        *   The toast disappears after 3 seconds.

### 4. Visual and Styling

*   **Test Case 4.1: Responsiveness**
    *   **Action:** Open the page and trigger a few toasts. Resize the browser window to different widths (e.g., mobile, tablet, desktop).
    *   **Expected Result:**
        *   Toasts remain in the top-right corner.
        *   Toast content (icon, message) wraps correctly if space is limited.
        *   Layout of the main page content is not broken by the toasts.
        *   (Manual observation)

*   **Test Case 4.2: Animation Sanity Check**
    *   **Action:** Trigger various toasts.
    *   **Expected Result:**
        *   Slide-in, fade-out, and progress bar animations are smooth.
        *   No visual glitches during animations.
        *   (Manual observation)
