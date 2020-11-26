---
layout: page
title: Documentation
permalink: /docs/
---

# Documentation

Welcome to the {{ site.title }} pages! Here you can quickly jump to a 
particular page.

<div class="section-index">
    <hr class="panel-line">
    {% for document in site.documents  %}        
    <div class="entry">
    <h5><a href="{{ doc.url | prepend: site.baseurl }}">{{ document.title }}</a></h5>
    <p>{{ document.description }}</p>
    </div>{% endfor %}
</div>
