/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
  app.route('/api/issues/:project')

    .get(function (req, res){
      var project = req.params.project;
      var query = req.query;

      if(query._id) {query._id = new ObjectId(query._id)}
      if(query.open) {query.open = String(query.open) === 'true'}

      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        let collection = db.collection(project);
        collection.find(query).toArray(function(err, doc) {
          res.json(doc);
        });
      });

    })

    .post(function (req, res){
      var project = req.params.project;
      var issue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        open: true,
        status_text: req.body.status_text || ''
      };
      if(!issue.issue_title || !issue.issue_text || !issue.created_by) {
        res.send('missing required fields');
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          let collection = db.collection(project);
          collection.insertOne(issue, function(err, doc) {
            issue._id = doc.insertedId
            res.json(issue);
          });
        });
      }

    })

    .put(function (req, res){
      var project = req.params.project;
    
      var issueId = req.body._id;
      delete req.body._id;
    
      var update = req.body;
      for(let el in update) {
        if(!update[el]) {
          delete update[el];
        }
      }
      if(update.open) { update.open = String(update.open) === 'true'}
      if(Object.keys(update).length === 0) {
        res.send('no updated field sent');
      } else {
        update.updated_on = new Date();
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          let collection = db.collection(project);
          collection.findAndModify({_id: new ObjectId(issueId)}, //query
                                   [['_id', 'asc']],             //sort
                                   {$set: update},               //properties to update
                                   {new: true},                  //return modified object
                                   function(err, doc) {
            if(err) {
              res.send(`could not update ${issueId}`);
            } else {
              res.send('successfully updated');
            }
          });
        });
      }
    })

    .delete(function (req, res){
      var project = req.params.project;
      var issueId = req.body._id;
      if(!issueId) {
        res.send('_id error');
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          let collection = db.collection(project);
          collection.findAndRemove({_id: new ObjectId(issueId)}, function(err, doc) {
            if(err) {
              res.send(`could not delete ${issueId}`);
            } else {
              res.send(`deleted ${issueId}`);
            }
          });
        });
      }
    });
    
};
