<!DOCTYPE html>
<html>
<head>
 <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
     integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
     crossorigin=""/>

 <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
     integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
     crossorigin=""></script>
</head>

<body>

<h1>Data from collection</h1>

<h2>Features</h2>

<div id="mapid" style="width: 800px; height: 600px; position: relative;" </div>
<script>

	var mymap = L.map('mapid').setView([52.300, 4.867], 12);

	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(mymap);

  geojson = JSON.parse(`{{ content.geojson|safe }}`);
  L.geoJSON(geojson).addTo(mymap);

</script>

</body>
</html>
