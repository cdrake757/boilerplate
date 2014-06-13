var map, mapOptions, center, mapStyles, styledMap;
var overlay_locations = [];
/**
* Gmapper.js
*
* Copyright (c) 2014 Ohm Labs Inc
* Licensed under the MIT license
* For all details and documentation:
* http://drake.fm/gmapper
*
* @version  0.2.0
* @author     Cameron W. Drake
* @copyright  Copyright (c) 2014 Ohm Labs
* @license    Licensed under the MIT license
*/
var Gmapper = (function(data){
  'use strict';
  /**
  * @class Gmapper
  * @constructor
  * @requires D3
  * @requires Google Maps
  * @requires Underscore
  */
  try {
    google.toString();
    d3.toString();
    _.toString();
  } catch(e){
    console.log("No access to google API, probably because there is no internet... fall back");
    return;
  }
  var context = this;
  context._initializeGMapper(data);

});
_.extend(Gmapper.prototype, {
  /**
   * Add an Google Maps Info Window.
   * @param {object} data The details for the location
   * @param {object} marker The Google Maps Marker
   * @param {object} map The Google Map
   */
  _addInfoWindow: function (data, marker, map)
  {
    'use strict';
    // initialize infoWindow
    var infowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(
        //'<div class="plus-icon" style="background-image:url(\'' + data.icon +'\');"></div>' +
        '<a href="' + data.url + '" target="_blank"><h1>' + data.name + '</h1></a>' +
        '<h2>' + data.readable_address + '</h2>' +
        '<h2>' + data.phone + '</h2>'
      );
      infowindow.open(map, this);
    });
  },

  /**
   * Add a D3 Overlay.
   * @param {object} data The details for the locations
   */
  _addOverlay: function (data, map)
  {
    'use strict';
    // Load the station data. When the data comes back, create an overlay.
    var overlay = new google.maps.OverlayView();
    // Add the container when the overlay is added to the map.
    overlay.onAdd = function() {
      var layer = d3.select(this.getPanes().overlayLayer).append("div")
          .attr("class", "offices");
      // Draw each marker as a separate SVG element.
      // We could use a single SVG, but what size would it have?
      overlay.draw = function() {
        var projection = this.getProjection(),
            padding = 10;
        function transform(d) {
          d = new google.maps.LatLng(d.value.latLng.latitude, d.value.latLng.longitude);
          d = projection.fromLatLngToDivPixel(d);
          return d3.select(this)
              .style("left", (d.x - padding) + "px")
              .style("top", (d.y - padding) + "px");
        }
        var marker = layer.selectAll("svg")
            .data(d3.entries(data))
            .each(transform) // update existing markers
          .enter().append("svg:svg")
            .each(transform)
            .attr("class", "marker");
        // Add a circle.
        marker.append("svg:circle")
            .attr("r", 10.5)
            .attr("cx", padding)
            .attr("cy", padding);
        // Add a label.
        marker.append("svg:text")
            .attr("x", padding + 7)
            .attr("y", padding)
            .attr("dy", ".31em")
            .text(function(d) { return d.value.name; });
      };
    };
    // Bind our overlay to the map…
    overlay.setMap(map);
  },

  /**
   * Add Google Maps Marker.
   * @param {object} data The details for the location
   * @param {object} icon The image to be used for the marker
   * @param {object} map The Google Map
   */
  _addMarker: function (data, map, icon)
  {
    'use strict';
    var gll;
    data.latLng.latitude ? gll = new google.maps.LatLng(data.latLng.latitude, data.latLng.longitude) : gll = data.latLng;
    var marker = new google.maps.Marker({
      position: gll,
      title: data.name,
      icon: icon,
      map: map
    });
    if (data.GooglePlacesReference) {
      this._getGoogleDetails(data, marker, map);
    } else {
      this._addInfoWindow(data, marker, map);
    }
    marker.setMap(map);
  },

  /**
   * Get Details for Google Place.
   * @param {object} data The details for the location
   * @param {object} marker The Google Maps Marker
   * @param {object} map The Google Map
   */
  _getGoogleDetails: function (data, marker, map)
  {
    'use strict';
    var service = new google.maps.places.PlacesService(map);
    var request = {
      reference: data.GooglePlacesReference
    };
    service.getDetails(request, function(details){
      data.readable_address = details.formatted_address;
      data.url = details.url;
      data.phone = details.formatted_phone_number;
      data.icon = details.icon;
      console.log(data.readable_address);
    });
    this._addInfoWindow(data, marker, map);
  },

  /**
   * Query Google Place.
   * @param {object} data The details for the location
   * @param {object} marker The Google Maps Marker
   * @param {object} map The Google Map
   * @param {string} query The query to make
   * @param {array} types The type of places to search
   */
  _googlePlaceQuery: function (query, map, center, radius, types, context)
  {
    'use strict';
    var request = {
      location: center,
      radius: radius,
      types: types,
      name: query
    };
    function googleSearchCallback(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          results[i].latLng = results[i].geometry.location;
          context._addMarker(results[i], map);
        }
      }
    }
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, googleSearchCallback);
  },

  /**
   * Geo-Code Locations.
   * @param {object} location The details for the location
   * @param {object} map The Google Map
   */
  _geoCodeLocations: function (location)
  {
    'use strict';
    var geocoder;
    geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': location.readable_address}, function(response, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        location.latLng = response[0].geometry.location;
        console.log(location );
      } else {
        console('Geocode was not successful for the following reason: ' + status);
        // TODO: Error Handler for Users
      }
    });
  },
  /**
  * Initialize GMapper
  * @param {string} icon Custom Marker Image
  * @param {string} theme Theme file to load (/static/maps)
  * @param {boolean} scrollWheel Scrollwheel defaults to disabled
  * @param {boolean} overlay D3 SVG overlay
  * @param {number} lat Latitude
  * @param {number} lng Longitude
  * @param {boolean} search Google Places Search
  * @param {string} query Search Query
  * @param {string} types Search Types
  * @param {string} radius Search Radius
  */
  _initializeGMapper: function(data){
    // load style from json
    if (data.theme !== null) {
      d3.json("files/" + data.theme + ".json", function(json) {
        mapStyles = json;
        styledMap = new google.maps.StyledMapType(mapStyles, {name: data.theme});
        //Associate the styled map with the MapTypeId and set it to display.
        map.mapTypes.set('map_style', styledMap);
        map.setMapTypeId('map_style');
      });
    }

    // set the center or default to oval */
    !data.lng || !data.lat ? center = new google.maps.LatLng(37.429856, -122.169425) : center = new google.maps.LatLng(data.lat, data.lng);

    // set zoom or default to 10 */
    !data.zoom ? data.zoom = 10 : null;

    // set scrollwheel or default to false */
    data.scrollWheel === null ? data.scrollWheel = false : null;

    mapOptions = {
      center: center,
      zoom: data.zoom,
      scrollwheel: data.scrollWheel,
      mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
      }
    };

    // initialize map
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    // If Google Places Search
    if (data.search){
      this._googlePlaceQuery(data.query, map, center, data.radius, data.types, context);
      return;
    }

    // If Locations are provided
    if (data.locations) {
      for (var i in data.locations) {
        var glocation = data.locations[i];
        if (!glocation.latLng){
          // we need lat and lng to plot on google map
          // send readable_address to Google geocoder
          this._geoCodeLocations(glocation, map);
        }
        if (!data.overlay) {
          // if you are not using d3 overlay or Google places search...
          if(glocation.GooglePlacesReference){
            this._addMarker(glocation, map, data.icon);
          }
        }
        // add the locations to an array
        if(glocation.GooglePlacesReference){
          overlay_locations.push(glocation);
        }
      }
    }

    // If D3 Overlay
    if (data.overlay) {
      // add array of officers to map in d3 overlay
      this._addOverlay(overlay_locations, map);
    }
  }
});
