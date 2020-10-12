---
layout: page
title: "Change log"
permalink: /change-log/
---

# Change log

Here we will describe the changes and updates of the Text Mod.

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
        <p> {{ post.content }} </p>
    </li>
  {% endfor %}
</ul>
