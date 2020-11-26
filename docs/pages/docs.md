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
    {% for doc in site.docs  %}        
    <div class="entry">
    <h5><a href="{{ doc.url | prepend: site.baseurl }}">{{ doc.title }}</a></h5>
    <p>{{ doc.description }}</p>
    </div>{% endfor %}
</div>
