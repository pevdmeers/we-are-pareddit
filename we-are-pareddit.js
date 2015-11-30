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
	'click .remove': function() {
		console.log("removing " + this._id);
		TopicList.remove(this._id);
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

}

if (Meteor.isServer) {
  /*
  Meteor.startup(function () {
    // code to run on server at startup
  });
  */
}

