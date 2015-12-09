TopicList = new Mongo.Collection("topics");

if (Meteor.isClient) {
/*
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });
  */

	Template.topiclist.helpers({
		'topic': function() {
			return TopicList.find();
		}
	});

	Template.topicview.events({
		'click h4 .remove': function() {
			console.log("removing " + this._id);
			TopicList.remove(this._id);
		},
		'click h4 .edit': function(event) {
			console.log("editing " + this._id);
			var div = event.target.parentElement.parentElement;
			$(div).addClass("hidden");
			$(div).next("div.topicForm").removeClass("hidden");
			var editCanvas = $(div).next("div.topicForm").find("div.map_canvas")[0];
			editCanvas.googleMap = createMap(editCanvas);
			editCanvas.googleMap.panTo(this.location);
			createMarkerOnMap(editCanvas.googleMap, this.location);
		},
		'click h4 .dislike': function() {
			console.log("disliking " + this._id);
			TopicList.update(this._id, {$inc: {dislikes: -1} });
		},
		'click h4 .like': function() {
			console.log("liking " + this._id);
			TopicList.update(this._id, {$inc: {dislikes: +1} });
		}
	});

	Template.newTopic.events({
		'click input[type=button].geo': function (event) {
			var map = $(event.target).nextAll("div.map_canvas")[0];
			var loc = $(event.target).prev("input[type=text].geo").val();
			doGeocoding(map, loc);
		},
		'submit form': function (event) {
			event.preventDefault();
			TopicList.insert({
				'title': event.target.topicTitle.value,
				'description': event.target.topicDescription.value,
				'dislikes': 0,
				'location': $(event.target).find("div.map_canvas")[0].googleMap.currentLocation.toJSON()
			});
			event.target.topicTitle.value = "";
			event.target.topicDescription.value = "";
		}
	});

	Template.editTopic.events({
		'click input[type=button].geo': function (event) {
			var map = $(event.target).nextAll("div.map_canvas")[0];
			var loc = $(event.target).prev("input[type=text].geo").val();
			doGeocoding(map, loc);
		},
		'submit form': function (event) {
			event.preventDefault();
			console.log("saving " + this._id);
			TopicList.update(this._id, {$set: {
				'title': event.target.topicTitle.value,
				'description': event.target.topicDescription.value,
				'location': $(event.target).find("div.map_canvas")[0].googleMap.currentLocation.toJSON()
			}});
			var form = event.target;
			$(form).parent().prev("div.topic").removeClass("hidden");
			$(form).parent().addClass("hidden");
		},
		'click .cancel': function (event) {
			var form = event.target.parentElement;
			$(form).parent().prev("div.topic").removeClass("hidden");
			$(form).parent().addClass("hidden");
		}
	});

	function createMap(mapDiv) {
		mapDiv.geocoder = new google.maps.Geocoder();

		if(mapDiv.options == undefined){
			// provide some default initialization options
			mapDiv.options = 
			{
				zoom: 8,
				center: new google.maps.LatLng(-34.397, 150.644),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
		}

		var mapObj = new google.maps.Map(mapDiv, mapDiv.options);
		google.maps.event.addListener(mapObj, "click", createMarkerFunctionForMap(mapObj));
		return mapObj;
	}

	function createMarkerOnMap(mapObj, loc) {
			mapObj.marker && mapObj.marker.setMap && mapObj.marker.setMap(null);
		  mapObj.marker = null;
			mapObj.marker = new google.maps.Marker(
				{ 
					map: mapObj,
					position: loc,
					title: "NEW MARKER"
				});	
			mapObj.panTo(loc);
			mapObj.currentLocation = loc;
	}

	function createMarkerFunctionForMap(mapObj) {
		return function (event) {
			createMarkerOnMap(mapObj, event.latLng);
		};
	}

	function getCurrentLocation(map) {

		var onError = function(error) {
			alert("Could not get the current location.");
		};

		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
					function(position) {

						// once we get here, we receive the position in the variable "position"
						// we use it to create a LatLng object (see documentation) for later usage
						var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

						// now that we have the current location, we need use the Map API to move the map to this location
						// you may also want to adjust the zoom level

						map.panTo(currentLocation);
						map.currentLocation = currentLocation;

						// remember that the map object was already initialised for you in createMap()
						// you can use it like this: map.whateverFunction() 

						// see the API reference for the relevant functions (you need to set the location, and set the zoom level):
						// https://developers.google.com/maps/documentation/javascript/reference#Map
					}, 
				onError
					);
		}else{
			onError();
		}
	}

	function doGeocoding(map, loc){

		var geocoderRequest = {
			address: loc
		};

		map.geocoder.geocode(geocoderRequest, function(results, status){
			if (status == google.maps.GeocoderStatus.OK) {

				// results is an array of GeocoderResult objects. Using only results[0] is sufficient
				// check the documentation to see what a GeocoderResult object looks like:
				// https://developers.google.com/maps/documentation/javascript/reference#GeocoderResult
				// use it to set the map to the returned location, similar to what you did in question 1

				var position = results[0];
				createMarkerOnMap(map.googleMap, position.geometry.location);
			}
		});
	}

	$.ajax({
		url: "http://maps.google.com/maps/api/js?sensor=false",
		dataType: "script",
		success: function () {
			var newTopicCanvas = $("form.new div.map_canvas")[0];
			newTopicCanvas.googleMap = createMap(newTopicCanvas);
			getCurrentLocation(newTopicCanvas.googleMap);
		}
	});
}

if (Meteor.isServer) {
	/*
		 Meteor.startup(function () {
	// code to run on server at startup
	});
	*/
}

