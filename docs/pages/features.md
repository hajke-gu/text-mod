---
layout: page
title: Features
permalink: /features
---

# Features

The following features are we planning to implement:

* Visualization of text data in a space efficient manner
* Viewinging of text data entries with large amount of text
* Copying of specific text data to the clipboard
* Sorting of text data
* Categorial and continuous coloring of text data
* Free customizability of the text visualization
* Displaying of an additional annotation information for every text field
* Support "marking" and "detailed visualization" 
* Seamless integration into the Spotfire environment

<div class="section-index">
{% for feature in site.features %}
    <hr class="panel-line">
    <div class="entry">
  <h2>
      {{ feature.name }}
    </a>
  </h2>
  <p>{{ feature.content | markdownify }}</p>
  </div>
{% endfor %}
</div>