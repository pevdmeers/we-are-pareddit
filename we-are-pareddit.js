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
			$(div).next("form").removeClass("hidden");
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
		'submit form': function (event) {
			event.preventDefault();
			TopicList.insert({
				'title': event.target.topicTitle.value,
				'description': event.target.topicDescription.value,
				'dislikes': 0
			});
			event.target.topicTitle.value = "";
			event.target.topicDescription.value = "";
		}
	});

	Template.editTopic.events({
		'submit form': function (event) {
			event.preventDefault();
			console.log("saving " + this._id);
			TopicList.update(this._id, {$set: {
				'title': event.target.topicTitle.value,
				'description': event.target.topicDescription.value
			}});
			var form = event.target;
			$(form).prev("div.topic").removeClass("hidden");
			$(form).addClass("hidden");
		},
		'click .cancel': function (event) {
			var form = event.target.parentElement;
			$(form).prev("div.topic").removeClass("hidden");
			$(form).addClass("hidden");
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

