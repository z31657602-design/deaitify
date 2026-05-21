---
layout: home
title: DeAItify Blog
---

# DeAItify Blog

Stay updated on AI detection, academic writing, and text humanization.

## Latest Posts

{% for post in site.posts %}
- [{{ post.title }}]({{ post.url }})
{% endfor %}
