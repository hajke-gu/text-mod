/*
 * Copyright © 2020. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

//@ts-check - Get type warnings from the TypeScript language server. Remove if not wanted.

/**
 * Get access to the Spotfire Mod API by providing a callback to the initialize method.
 * @param {Spotfire.Mod} mod - mod api
 */
Spotfire.initialize(async (mod) => {
    var lastMarkedIndex = 0;
    var prevIndex = 0;
    var prevCardBy = "(Row Number)";

    // create the read function
    const reader = mod.createReader(
        mod.visualization.data(),
        mod.windowSize(),
        mod.visualization.axis("Content"),
        mod.visualization.axis("Sorting"),
        mod.visualization.axis("Card by"),
        mod.property("sortOrder")
    );

    const modDiv = findElem("#text-card-container");

    // store the context
    const context = mod.getRenderContext();

    // used to set max number of cards to equal the number of rows of dataset
    mod.visualization.axis("Card by").setExpression("<baserowid()>");

    // initiate the read loop
    reader.subscribe(render);

    /**
     * @param {Spotfire.DataView} dataView
     * @param {Spotfire.Size} windowSize
     * @param {Spotfire.Axis} contentProp
     * @param {Spotfire.Axis} sortingProp
     */
    // @ts-ignore
    async function render(dataView, windowSize, contentProp, sortingProp, cardbyProp, sortOrder) {
        /**
         * Check data axes
         * - Check if content empty
         * - Check if content is multiple
         * - Check if sorting is multiple
         * - Check if card by is empy
         */

        if (contentProp.parts.length == 0) {
            mod.controls.errorOverlay.show("Select the 'Content' of the text cards to get started!");
            return;
        } else if (cardbyProp.parts.length == 0) {
            mod.controls.errorOverlay.show(
                "Select a 'Card by' to get started! Default value (for non-aggregated data): (Row Number)"
            );
            return;
        } else if (contentProp.parts.length > 1 || sortingProp.parts.length > 1) {
            if (contentProp.parts.length > 1)
                mod.controls.errorOverlay.show("Selecting multiple columns in 'Content' is not supported.");
            else if (sortingProp.parts.length > 1) {
                mod.controls.errorOverlay.show("Selecting multiple columns in 'Sorting' is not supported.");
            } else {
                mod.controls.errorOverlay.show(
                    "If this text can be seen. Tell Jonatan that he did something very wrong!"
                );
            }
            return;
        }
        mod.controls.errorOverlay.hide();

        if (cardbyProp.parts[0].displayName !== "(Row Number)") {
            if (cardbyProp.parts[0].displayName === prevCardBy) {
            } //Do nothing
            else {
                console.log("WARNING");
                createWarning(mod, modDiv, context.styling.general.font.color, cardbyProp);
                prevCardBy = cardbyProp.parts[0].displayName;
            }
        } else {
            prevCardBy = "(Row Number)";
        }

        // non-global value
        const cardsToLoad = 100;

        // check dataview for errors
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            // Showing an error overlay will hide the mod iframe.
            // Clear the mod content here to avoid flickering effect of
            // an old configuration when next valid data view is received.
            mod.controls.errorOverlay.show(errors);
            return;
        }
        mod.controls.errorOverlay.hide();

        modDiv.style.height = windowSize.height + "px";

        // get rows/data from dataview via api
        var rows = await dataView.allRows();

        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

        // check if sorting is enabled
        let sortingEnabled = false;
        if ((await dataView.categoricalAxis("Sorting")) != null) {
            // create sort button only if there is a value selected in sorting axis
            sortingEnabled = true;
            if (sortOrder.value() != "unordered") {
                sortRows(rows, sortOrder.value());
            }
        } else {
            //set back default value
            sortOrder.set("asc");
        }

        // check if tooltip is enabled
        var tooltip = false;
        if ((await dataView.categoricalAxis("Tooltip")) != null) tooltip = true;

        // check if annotation is enabled
        var annotationEnabled = false;
        if ((await dataView.categoricalAxis("Annotation")) != null) annotationEnabled = true;

        var rerender = true;

        var returnedObject = renderTextCards(
            rows,
            prevIndex, // When rerendering we always want to render everything
            cardsToLoad,
            rerender,
            windowSize,
            mod,
            tooltip,
            annotationEnabled,
            dataView
        );
        // @ts-ignore
        modDiv.appendChild(returnedObject.fragment);
        // @ts-ignore
        prevIndex = returnedObject.startIndex;

        // de-mark on click on something that isn't text card *
        var modContainer = document.getElementById("text-card-container");
        modDiv.onmousedown = (e) => {
            let width = modDiv.getBoundingClientRect().width;
            if (!(e.clientX < width && e.clientX > width - 12)) {
                dataView.clearMarking();
            }
        };

        // down-key event listener
        document.onkeydown = (e) => {
            var selectedText = getSelectedText();
            if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedText !== "") {
                textToClipboard(selectedText);
                selectedText = "";
            }
            if (e.key === "ArrowUp") {
                modContainer.scrollBy(0, -100);
            }
            if (e.key === "ArrowDown") {
                modContainer.scrollBy(0, 100);
            } else {
                return;
            }
        };

        // scroll event listener
        // @ts-ignore
        modDiv.addEventListener("scroll", async function (e) {
            if (modDiv.scrollHeight - modDiv.scrollTop <= modDiv.clientHeight + 1) {
                // check if dataview is up to date
                if (await dataView.hasExpired()) {
                    return;
                }
                var rerender = false;

                var returnedObject = renderTextCards(
                    rows,
                    prevIndex,
                    cardsToLoad,
                    rerender,
                    windowSize,
                    mod,
                    tooltip,
                    annotationEnabled,
                    dataView
                );
                // @ts-ignore
                modDiv.appendChild(returnedObject.fragment);
                // @ts-ignore
                prevIndex = returnedObject.startIndex;
            }
        });

        //Create SortButton
        if (sortingEnabled) createSortButton(modDiv, mod.getRenderContext().styling.general.font.color, sortOrder);

        // signal that the mod is ready for export.
        context.signalRenderComplete();
    }
});
