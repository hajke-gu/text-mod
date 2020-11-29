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
    <h2><a href="{{ doc.url | prepend: site.baseurl }}">{{ document.title }}</a></h2>
    <p>Link: {{ doc.url }} and {{ site.baseurl }} </p>
    <p>{{ document.content }}</p>
    </div>{% endfor %}
</div>
