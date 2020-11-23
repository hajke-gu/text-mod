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
    var prevIndex = 0;
    /**
     * Create the read function.
     */
    const reader = mod.createReader(
        mod.visualization.data(),
        mod.windowSize(),
        mod.property("myProperty"),
        mod.visualization.axis("Content"),
        mod.visualization.axis("Sorting")
    );

    const modDiv = findElem("#text-card-container");

    /**
     * Store the context.
     */
    const context = mod.getRenderContext();

    //** fix axis */
    mod.visualization.axis("Card by").setExpression("<baserowid()>");

    /**
     * Initiate the read loop
     */
    reader.subscribe(render);

    /**
     * @param {Spotfire.DataView} dataView
     * @param {Spotfire.Size} windowSize
     * @param {Spotfire.ModProperty<string>} prop
     * @param {Spotfire.Axis} contentProp
     * @param {Spotfire.Axis} sortingProp
     */
    async function render(dataView, windowSize, prop, contentProp, sortingProp) {
        /**
         * Check data axes
         * - Check if content empty
         * - Check if content is multiple
         * - Check if sorting is multiple
         * - Check if card by is Row Number
         */

        if (contentProp.parts.length == 0) {
            mod.controls.errorOverlay.show("Select a content to get started!");
            return;
        } else if (contentProp.parts.length > 1 || sortingProp.parts.length > 1) {
            if (contentProp.parts.length > 1)
                mod.controls.errorOverlay.show("Selecting Multiple Content is not allowed.");
            else if (sortingProp.parts.length > 1) {
                mod.controls.errorOverlay.show("Selecting Multiple Sortings is not allowed.");
            } else {
                mod.controls.errorOverlay.show(
                    "If this text can be seen. Tell Jonatan that he did something very wrong!"
                );
            }
            return;
        }
        mod.controls.errorOverlay.hide();
        /*
         * NON-GLOBALS
         */
        const cardsToLoad = 100;

        /**
         * Check the data view for errors
         */
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

        /**
         * Get rows from dataView
         */
        var rows = await dataView.allRows();

        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

        /**
         * Sort rows
         */
        if ((await dataView.categoricalAxis("Sorting")) != null) {
            sortRows(rows);
        }

        /**
         * Check if tooltip enabled
         */
        var tooltip = false;
        if ((await dataView.categoricalAxis("Tooltip")) != null) tooltip = true;

        /**
         * Check if annotation enabled
         */
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
            annotationEnabled
        );

        modDiv.appendChild(returnedObject.fragment);
        prevIndex = returnedObject.startIndex;

        /**
         * De-mark on click on something that isn't text card *
         */
        var modContainer = document.getElementById("text-card-container");
        modDiv.onmousedown = (e) => {
            let width = modDiv.getBoundingClientRect().width;
            if (!(e.clientX < width && e.clientX > width - 12)) {
                dataView.clearMarking();
            }
        };

        document.onkeydown = (e) => {
            //console.log(e.key.toString());
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
                //console.log(e.key, " pressed");
            }
        };

        /*
         * Scroll Event Listener
         */
        modDiv.addEventListener("scroll", async function (e) {
            if (modDiv.scrollHeight - modDiv.scrollTop <= modDiv.clientHeight + 1) {
                //Check if old data view
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
                    annotationEnabled
                );
                modDiv.appendChild(returnedObject.fragment);
                prevIndex = returnedObject.startIndex;
            }
        });

        /*
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});
