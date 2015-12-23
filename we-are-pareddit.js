TopicList = new Mongo.Collection("topics");

if (Meteor.isServer) {
	TopicList._ensureIndex({
	'title': 'text',
	'description': 'text'
	// voegt index toe, voor search
	});

	Meteor.publish("search", function(query) {
  if (!query) {
    return TopicList.find({});
     }
     console.log("Searching for", query);
     var cursor = TopicList.find(
      { $text: {
          $search: query
        }
      },
      {
        fields: {
          score: {
            $meta: 'textScore'
          }
        },
        sort: {
          score: {
            $meta: 'textScore'
          }
        }
      }
    );
     return cursor;

});
}




if (Meteor.isClient) {

	Template.topiclist.helpers({				//Topiclist helpers
		'topic': function() {					//
			return TopicList.find();
		}
	});


	Template.topicview.helpers({				//topicview Helpers
		'userIsOwner': function() {
			var user = Meteor.user();
			if (user) {
				return this.user == user._id;
			} else {
				return false;
			}
		},
		'socialShareOpts': function() {
			var opts = {
			facebook: true,
			twitter: true,
			pinterest: false,
			shareData: {
			url: 'http://we-are-pareddit.com/?' + this._id,
			defaultShareText: this.title + " - " + this.description
        		}
      		};
      	return opts;
    }

	});

	Template.topicview.events({     		//topicview events
		
		'click h4 .location': function(event) {       //when location button is pressed, it shows the location
			var button = $(event.target);
			var geoDiv = button.parent().nextAll("div.geoDiv");
			var canvas = geoDiv.children("div.map_canvas")[0];
			$(geoDiv).show();
			canvas.googleMap = createMap(canvas);
			createMarkerOnMap(canvas.googleMap, this.location);		
		},
		
		'click h4 .remove': function() {			//when remove button is pressed, this deletes the topic, and logs it
			console.log("removing " + this._id);
			TopicList.remove(this._id);
		},
		
		'click h4 .edit': function(event) {			//when edit button is pressed, this unhides the editTopic, and hides the topicview, and logs it
			console.log("editing " + this._id);
			var div = event.target.parentElement.parentElement;
			$(div).addClass("hidden");
			$(div).next("div.topicForm").removeClass("hidden");
		},
		'click h4 .dislike': function() {			//when dislike button is pressed, this lowers the score by one
			console.log("disliking " + this._id);
			TopicList.update(this._id, {$inc: {dislikes: -1} });
		},
		'click h4 .like': function() {
			console.log("liking " + this._id);		//when like button is pressed, this increases the score by one
			TopicList.update(this._id, {$inc: {dislikes: +1} });
		}
		
	});

	Template.editTopicForm.events({					//editTopicForm events
		'click input[type=button].geo': function (event) {		//when pressing the add location option, this shows the marked location so you can edit it
			var map = $(event.target).nextAll("div.map_canvas")[0]; 
			var loc = $(event.target).prev("input[type=text].geo").val();
			doGeocoding(map, loc);
		}
	});

	Template.newTopic.events({								//newTopic events
		'change input.geoSwitch': function (event) {    	//by clicking the checkbox, calls fucntion
			showMap(event);									//named function, shows the map to add a custom location
		},
		'submit form': function (event) {					//if form is submitted => function
			event.preventDefault();							//stop standard submit function, instead do ...
			var canvas = $(event.target).find("div.map_canvas")[0];		
			TopicList.insert({
				'title': event.target.topicTitle.value,
				'description': event.target.topicDescription.value,
				'dislikes': 0,
				'location': canvas.googleMap && canvas.googleMap.currentLocation.toJSON(),
				'user': Meteor.user()._id
			});
			event.target.topicTitle.value = "";
			event.target.topicDescription.value = "";
		}
	});

	Template.editTopic.events({						//editTopic
		'change input.geoSwitch': function (event) {
			showMap(event, this.location);
		},
		'submit form': function (event) {
			event.preventDefault();
			console.log("saving " + this._id);
			var canvas = $(event.target).find("div.map_canvas")[0];
			TopicList.update(this._id, {$set: {
				'title': event.target.topicTitle.value,
				'description': event.target.topicDescription.value,
				'location': canvas.googleMap && canvas.googleMap.currentLocation.toJSON()
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
	
	Template.search.events({     					//search
    "submit #search": function (e) {
      e.preventDefault();
      Session.set("query", $("#query").val());
    }
  });

	Template.search.helpers({ 						//search
	 topiclist: function() {
    Meteor.subscribe("search", Session.get("query"));
    if (Session.get("query")) {
      return TopicList.find({}, { sort: [["score", "desc"]] });
    } else {
      return TopicList.find({});
    }
  }
});
 

	function showMap(event, location) {			//maps
		var checkbox = $(event.target);
		var geoDiv = checkbox.nextAll("div.geoDiv");
		var canvas = geoDiv.children("div.map_canvas")[0];
		if (checkbox.prop('checked')) {
			$(geoDiv).show();
			canvas.googleMap = createMap(canvas);
			if (location) {
				createMarkerOnMap(canvas.googleMap, location);
			} else {
				getCurrentLocation(canvas.googleMap);
			}
		} else {
			$(geoDiv).hide();
			canvas.googleMap = undefined;
		}
	}

	function createMap(mapDiv) {				//maps
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

	function createMarkerOnMap(mapObj, loc) {				//maps
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

	function createMarkerFunctionForMap(mapObj) {		//maps
		return function (event) {
			createMarkerOnMap(mapObj, event.latLng);
		};
	}

	function getCurrentLocation(map) {					//maps

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

	function doGeocoding(map, loc){					//maps

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

	$.ajax({										//ajax to make map dynamic
		url: "http://maps.google.com/maps/api/js?sensor=false",
		dataType: "script"
	});

}
	


	/*
		 Meteor.startup(function () {
	// code to run on server at startup
	});
	*/


