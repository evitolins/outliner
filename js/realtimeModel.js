;(function() {
'use strict';

  var clientId = '25911058412-5cd4rmeie654agjb6j6s9nb05u8ao7h1.apps.googleusercontent.com';
  var realtimeUtils = new utils.RealtimeUtils({ clientId: clientId });

  var docModel;
  var docRoot;

  var documentID;

  authorize();

  function authorize() {
    realtimeUtils.authorize(function(response){
      if(response.error){
        var button = document.getElementById('auth_button');
        button.classList.remove('invisible');
        button.addEventListener('click', function () {
          realtimeUtils.authorize(function(response){
            button.classList.add('invisible');
            start();
          }, true);
        });
      } else {
        start();
      }
    }, false);
  }

  function start() {
    registerCustomTypes()
    var id = realtimeUtils.getParam('id');
    if (id) {
      // Load the document id from the URL
      realtimeUtils.load(id.replace('/', ''), onFileLoaded, onFileInitialize);
      documentID = id.replace('/', '');
    } else {
      // Create a new document, add it to the URL
      
      window.gapi.client.load('drive', 'v2', function() {

        var insertHash = {
          'resource': {
            mimeType: 'outliner/outliner',
            title: 'Untitled outline.outliner',
            parents: ['Outliner'], 
            labels: { restricted: true }
          }
        };



        window.gapi.client.drive.files.insert(insertHash).execute(function(createResponse) {
          //console.log(createResponse)
          window.history.pushState(null, null, '?id=' + createResponse.id);
          realtimeUtils.load(createResponse.id, onFileLoaded, onFileInitialize);
          documentID = createResponse.id;
        });

      });


      // realtimeUtils.createRealtimeFile('Untitled outline', function(createResponse) {
      //   //console.log(createResponse)
      //   window.history.pushState(null, null, '?id=' + createResponse.id);
      //   realtimeUtils.load(createResponse.id, onFileLoaded, onFileInitialize);
      // });
    }
  }

  function onFileInitialize(model) {
    var documentMetadata = model.createMap();
    model.getRoot().set('documentMetadata', documentMetadata);
    documentMetadata.set('title', 'New Outline');
    documentMetadata.set('author', 'Charles Forman');

    var viewData = model.createMap();
    model.getRoot().set('viewData', viewData);
    viewData.set('mode', 'default');
    viewData.set('scale', 2);

    var outlineNodes = model.createList();
    model.getRoot().set('outlineNodes', outlineNodes);

    var node = model.create('OutlineNode');
    node.title = 'this is a beat!';
    node.type = 'beat';

    var index = outlineNodes.push(node);
    node.order = index;

    var node = model.create('OutlineNode');
    node.title = 'this is a scene!';
    node.type = 'scene';
    node.synopsis = 'this is a synopsis';
    node.setting = 'apartment';
    node.timeOfDay = 'night';
    node.tags.push('apartment');
    node.tags.push('fun');
    node.tags.push('excitement');

    var index = outlineNodes.push(node);
    node.order = index;

  }


  function displayObjectChangedEvent(evt) {
    console.log("EVENT:");
    console.log(evt);


    var events = evt.events;
    var eventCount = evt.events.length;
    console.log(events[0].target)
    for (var i = 0; i < eventCount; i++) {

      switch (events[i].type) {
        case "values_added": 
          for (var i2 = 0; i2 < events[i].values.length; i2++) {
            if (!events[i].isLocal){
              outlinerApp.addLocalNode(events[i].values[i2])
            }
            
          }

          console.log(events[i].target)
          console.log(events[i].values)

          break;
        case "values_removed": 
          for (var i2 = 0; i2 < events[i].values.length; i2++) {
            if (!events[i].isLocal){
              // console.log("EVENTS");
              // console.log(events[i].values[i2].id)
              outlinerApp.removeLocalNode(events[i].values[i2].id)
            }
            
          }

          console.log(events[i].target)
          console.log(events[i].values)

          break;
        case "value_changed":
          switch (events[i].property) {
            case "type":
              if (!events[i].isLocal){
                outlinerApp.changeLocalNodeType(events[i].target);
              }
              break;
            case "title":
              if (!events[i].isLocal){
                outlinerApp.updateLocalTitle(events[i].target);
              }
              break;
            case "imageURL":
              if (!events[i].isLocal){
                outlinerApp.refreshNode(events[i].target.id);
              }
              break;

          }
          outlinerApp.reflow();
      }



      console.log('Event type: '  + events[i].type);
      console.log('Local event: ' + events[i].isLocal);
      console.log('User ID: '     + events[i].userId);
      console.log('Session ID: '  + events[i].sessionId);
    }
  }

  function onFileLoaded(doc) {
    docModel = doc.getModel();
    docRoot = docModel.getRoot();




    var outlineNodes = docRoot.get('outlineNodes');



    docRoot.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, displayObjectChangedEvent);






    outlinerApp.load(outlineNodes);



    // var collaborativeString = doc.getModel().getRoot().get('demo_string');
    // wireTextBoxes(collaborativeString);

    //gapi.drive.realtime.debug();
  }

  var OutlineNode = function(){};

  function registerCustomTypes() {

    function initializeOutlineNode() {
      var model = gapi.drive.realtime.custom.getModel(this);
      this.id = Date.now();
      this.tags = model.createList();
      this.actors = model.createList();
      this.beats = model.createList();
    }

    gapi.drive.realtime.custom.registerType(OutlineNode, 'OutlineNode');

    OutlineNode.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
    OutlineNode.prototype.order = gapi.drive.realtime.custom.collaborativeField('order');
    OutlineNode.prototype.type = gapi.drive.realtime.custom.collaborativeField('type');
    OutlineNode.prototype.title = gapi.drive.realtime.custom.collaborativeField('title');
    OutlineNode.prototype.synopsis = gapi.drive.realtime.custom.collaborativeField('synopsis');
    OutlineNode.prototype.imageURL = gapi.drive.realtime.custom.collaborativeField('imageURL');
    OutlineNode.prototype.setting = gapi.drive.realtime.custom.collaborativeField('setting');
    OutlineNode.prototype.timeOfDay = gapi.drive.realtime.custom.collaborativeField('timeOfDay');
    OutlineNode.prototype.text = gapi.drive.realtime.custom.collaborativeField('text');
    OutlineNode.prototype.time = gapi.drive.realtime.custom.collaborativeField('time');
    OutlineNode.prototype.tags = gapi.drive.realtime.custom.collaborativeField('tags');
    OutlineNode.prototype.actors = gapi.drive.realtime.custom.collaborativeField('actors');
    OutlineNode.prototype.beats = gapi.drive.realtime.custom.collaborativeField('beats');

    gapi.drive.realtime.custom.setInitializer(OutlineNode, initializeOutlineNode);
  }


  var addNode = function(index) {
    var outlineNodes = docRoot.get('outlineNodes');

    var node = docModel.create('OutlineNode');
    node.title = '';
    node.type = 'beat';
    // node.synopsis = 'this is a synopsis';
    // node.setting = 'apartment';
    // node.timeOfDay = 'night';
    // node.tags.push('apartment');
    // node.tags.push('fun');
    // node.tags.push('excitement');

    outlineNodes.insert(index, node);
    return node;
  }

  var move = function(index, destIndex) {
    var outlineNodes = docRoot.get('outlineNodes');
    outlineNodes.move(index, destIndex);
  }

  var remove = function(index) {
    var outlineNodes = docRoot.get('outlineNodes');
    outlineNodes.remove(index);    
  }


  var outlineNodesAsArray = function() {
    return docRoot.get('outlineNodes').asArray();
  }


  window.realtimeModel = {
    outlineNodesAsArray: outlineNodesAsArray,
    addNode: addNode,
    move: move,
    remove: remove,
    getID: function(){ return documentID; }
  };

}).call(this);