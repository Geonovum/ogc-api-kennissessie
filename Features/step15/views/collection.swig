<!DOCTYPE html>
<html>
<body>

<h1>Metadata about the feature collection</h1>

<h2>Collection</h2>
<h3>{{ content.description }} ({{ content.title }})</h3>
<p>{{ content.title }}</p>

<h4>Links for the collection</h4>
<p>items = <a href="{{ content.url }}collections/{{ content.title }}/items">{{ content.title }}</a> (application/json)</p>

<h2>Links</h2>

<p>
    self = 
<a href="{{ content.url }}collections">Metadata about the feature collections</a>
(application/json)
</p>

<h2>JSON output</h2>
<p>Get raw <a href="{{ content.url }}collections?f=json">JSON</a></p>


</body>
</html>
