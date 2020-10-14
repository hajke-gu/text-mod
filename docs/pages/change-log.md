---
layout: page
title: "Change log"
permalink: /change-log/
---

# Change log

Here we will describe the changes and updates of the Text Mod.


  {% for post in site.posts %}
  <h5>{{ post.title }}</h5>
        <p> {{ post.content }} </p>
            <hr class="panel-line">

  {% endfor %}

