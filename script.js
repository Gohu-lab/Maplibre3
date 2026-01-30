//Appel de la dépendance pour lire du PMTiles
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Configuration de la carte
var map = new maplibregl.Map({
  container: "map",
  style:
    "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json", // Fond de carte
  customAttribution:
    '<a href="https://sites-formations.univ-rennes2.fr/mastersigat/"target="_blank">Master SIGAT</a>',
  center: [-1.68, 48.11], // lat/long
  zoom: 11.5, // zoom
  pitch: 0, // Inclinaison
  bearing: -10, // Rotation
  minZoom: 11
});

// Boutons de navigation
var nav = new maplibregl.NavigationControl();
map.addControl(nav, "top-left");

// Ajout Echelle cartographique
map.addControl(
  new maplibregl.ScaleControl({
    maxWidth: 60,
    unit: "metric"
  })
);

//Appel flux
map.on("load", function () {
  //Ajout PMTiles Plu rennes
  map.addSource("Plu", {
    type: "vector",
    url:
      "pmtiles://https://raw.githubusercontent.com/Gohu-lab/data_Mapbox/main/Plui.pmtiles"
  });

  map.addLayer({
    id: "PLURM",
    type: "fill",
    source: "Plu",
    layout: { visibility: "none" },
    "source-layer": "Plui",
    paint: {
      "fill-color": [
        "match",
        ["get", "typezone"],
        "U",
        "#DE6550",
        "N",
        "#5DB021",
        "A",
        "#FAD864",
        "Ah",
        "orange",
        "#ccc"
      ],
      "fill-opacity": 0.7,
      "fill-outline-color": "white",
    }
  });

  
  // Ajout lignes de metros (github)
  map.addSource("lignes", {
    type: "geojson",
    data:
      "https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/metro-du-reseau-star-traces-de-laxe-des-lignes/exports/geojson?lang=fr&timezone=Europe%2FBerlin"
  });

  map.addLayer({
    id: "lignesmetros",
    type: "line",
    source: "lignes",
    layout: { visibility: "visible" },
    paint: {
      "line-opacity": 0.7,
      "line-width": 3.5,
      "line-color": [
        "match",
        ["get", "ligne"],
        "a",
        "#E32222",
        "b",
        "#1CD932",
        "white"
      ]
    },
    minzoom: 11
  });

  //Ajout du cadastre
  map.addSource("Cadastre", {
    type: "vector",
    url: "https://openmaptiles.geo.data.gouv.fr/data/cadastre.json"
  });

  map.addLayer({
    id: "Cadastre",
    type: "line",
    source: "Cadastre",
    "source-layer": "parcelles",
    layout: { visibility: "none" },
    paint: { "line-color": "#000000", "line-width": 0.5 },
    minzoom: 15,
    maxzoom: 19
  });

  //PLU
  map.addLayer({
    id: "PLUcontour",
    type: "line",
    source: "Plu",
    layout: { visibility: "none" },
    "source-layer": "Plui",
    paint: {
      "line-color": "#E3E3E3",
      "line-width": {
        stops: [
          [11, 0.2],
          [16, 2]
        ]
      }
    }
  });

  // Ajout BDTOPO
  map.addSource("BDTOPO", {
    type: "vector",
    url: "https://data.geopf.fr/tms/1.0.0/BDTOPO/metadata.json",
    minzoom: 14,
    maxzoom: 19
  });

  map.addLayer({
    id: "vegetation",
    type: "fill",
    source: "BDTOPO",
    "source-layer": "zone_de_vegetation",
    layout: { visibility: "visible" },
    paint: { "fill-color": "#50DE55", "fill-opacity": 0.7 },
    minzoom : 15
  });

  map.addLayer({
    id: "batiments",
    type: "fill-extrusion",
    source: "BDTOPO",
    "source-layer": "batiment",
    layout: { visibility: "visible" },
    paint: {
      "fill-extrusion-color": "#BCB8C2",
      "fill-extrusion-height": { type: "identity", property: "hauteur" },
      "fill-extrusion-opacity": 0.95,
      "fill-extrusion-base": 0
    },
    minzoom : 15
  });

  //Contours communes
  map.addSource("ADMIN_EXPRESS", {
    type: "vector",
    url: "https://data.geopf.fr/tms/1.0.0/ADMIN_EXPRESS/metadata.json",
    minzoom: 1,
    maxzoom: 19
  });

  map.addLayer({
    id: "communes",
    type: "line",
    source: "ADMIN_EXPRESS",
    "source-layer": "commune",
    layout: { visibility: "visible" },
    paint: {
      "line-color": "#3B3A3A",
      "line-width": {
        stops: [
          [5, 0.2],
          [8, 0.5]
        ]
      }
    }
  });

  //Ajout API des vélos star
  $.getJSON(
    "https://data.explore.star.fr/api/explore/v2.1/catalog/datasets/vls-stations-etat-tr/records?limit=60", //limit=20 => modifier en fonction de la donnée
    function (data) {
      var geojsonData4 = {
        type: "FeatureCollection",
        features: data.results.map(function (element) {
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [element.coordonnees.lon, element.coordonnees.lat]
            }, //position des points
            properties: {
              name: element.nom,
              capacity: element.nombreemplacementsactuels,
              dispo: element.nombrevelosdisponibles
            }
          }; //Va chercher les propriétés des champs
        })
      };

      map.addLayer({
        id: "VLS",
        type: "circle",
        layout: { visibility: "none" },
        source: { type: "geojson", data: geojsonData4 },
        paint: { "circle-color": "#27ADF5", "circle-radius": 4 }
      });
    }
  );

  $.getJSON(
    "https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/tco-parcsrelais-star-etat-tr/records?limit=20",
    function (data) {
      var geojsonData4 = {
        type: "FeatureCollection",
        features: data.results.map(function (element) {
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [element.coordonnees.lon, element.coordonnees.lat]
            },
            properties: { name: element.nom, capacity: element.jrdinfosoliste }
          };
        })
      };

      map.addLayer({
        id: "Parcrelais",
        type: "circle",
        source: { type: "geojson", data: geojsonData4 },
        paint: {
          "circle-radius": 6,
          "circle-color": "white",
          "circle-opacity": 0.6,
          "circle-stroke-color": "#0B3D98",
          "circle-stroke-width": 2.5
        }
      });
    }
  );

  //Fin
});


//Interactivité HOVER
var popup = new maplibregl.Popup({
  className: "popuprelais",
  closeButton: false,
  closeOnClick: false
});
map.on("mousemove", function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ["Parcrelais"] });
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = features.length ? "pointer" : "";
  if (!features.length) {
    popup.remove();
    return;
  }
  var feature = features[0];
  popup
    .setLngLat(feature.geometry.coordinates)
    .setHTML(
      "<h3>" + feature.properties.name + "</h3>" + feature.properties.capacity + " places"
    )
    .addTo(map);
});

//Interactivité CLICK sur VLS

map.on("click", function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ["VLS"] });
  if (!features.length) {
    return;
  }
  var feature = features[0];
  var popup3 = new maplibregl.Popup({ className: "Mypopup2", offset: [0, -15] })
    .setLngLat(e.lngLat)
    .setHTML(
      "<h3>" +
        feature.properties.name +
        "</h3>" +
        "Nombre de places: " +
        feature.properties.capacity +
        "<br>" +
        feature.properties.dispo +
        " Vélos disponibles"
    )
    .addTo(map);
});
map.on("mousemove", function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ["VLS"] });
  map.getCanvas().style.cursor = features.length ? "url('https://staging.svgrepo.com/show/286570/loupe-search.svg') 16 16, pointer" : "default";
});


switchlayer = function (lname) {
            if (document.getElementById(lname).checked) {
                map.setLayoutProperty(lname, 'visibility', 'visible');
            } else {
                map.setLayoutProperty(lname, 'visibility', 'none');
           }
        }


// Fonction d'inclinaison au zomm 15
map.on('zoomend', function() {
    if (map.getZoom() >= 15) {
        map.easeTo({
            pitch: 55, // Angle d'inclinaison souhaité (45 degrés ici)
            duration : 800,
            easing: (t) => t // Fonction d'interpolation pour une transition fluide
        });
    } else {
        map.easeTo({
            pitch: 0, // Réinitialiser l'inclinaison à 0
            duration : 800,
            easing: (t) => t
        });
    }
});


// Configuration onglets géographiques 

document.getElementById('Rennes').addEventListener('click', function () 
{ map.flyTo({zoom: 12,
           center: [-1.672, 48.1043],
	          pitch: 0,
            bearing:0 });
});

document.getElementById('Gare').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.672, 48.1043],
	          pitch: 20,
            bearing: -197.6 });
});


document.getElementById('Rennes1').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.6396, 48.1186],
	          pitch: 20,
            bearing: -197.6 });
});

document.getElementById('Rennes2').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.7023, 48.1194],
	          pitch: 30,
            bearing: -197.6 });
});