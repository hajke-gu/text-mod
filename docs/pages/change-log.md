---
layout: page
title: "Change log"
permalink: /change-log/
---

# Change log

Here we will describe the changes and updates of the Text Mod.

<div class="section-index">
    <hr class="panel-line">
    {% for post in site.posts  %}        
    <div class="entry">
    <h5>{{ post.title }}</h5>
    <p>{{ post.content }}</p>
    </div>{% endfor %}
</div>
