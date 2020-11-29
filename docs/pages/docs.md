---
layout: page
title: Documentation
permalink: /docs/
---

# Documentation

Here we will provide basic documentation of the text mod. For details, check out the github repository. 

<div class="section-index">
    <hr class="panel-line">
    {% for document in site.documents  %}        
    <div class="entry">
    <h5><a href="{{ document.url | prepend: site.baseurl }}">{{ document.title }}</a></h5>
    <p>Link: {{ document.url }} and {{ site.baseurl }} </p>
    <p>{{ document.content }}</p>
    </div>{% endfor %}
</div>
