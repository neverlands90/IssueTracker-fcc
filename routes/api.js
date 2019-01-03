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

//Issue Model
var mongoose = require('mongoose');
mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true });
var issueSchema = new mongoose.Schema({
  issue_title: String,
  issue_text: String,
  created_by: String,
  assigned_to: String,  //optional
  status_text: String,  //optional
  created_on: Date,
  updated_on: Date,
  open: Boolean,
  project: String  //???
});
var Issue = mongoose.model('Issue', issueSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      //I can GET /api/issues/{projectname} for an array of all issues on that specific project with all the information for each issue as was returned when posted.
      //I can filter my get request by also passing along any field and value in the query(ie. /api/issues/{project}?open=false). I can pass along as many fields/values as I want.
      Issue.find({project: project}, (err, issues) => {
        let issuesFL = issues;
        for (var p in req.query) {
          issuesFL = issuesFL.filter(issue => {
            if (p == 'open') return issue[p] == (req.query.open == 'true' ? true : false);
            return issue[p] == req.query[p];
          });
        }
        res.json(issuesFL);
      });
    })
    
    .post(function (req, res){
      var project = req.params.project;      
      //I can POST /api/issues/{projectname} with form data containing required issue_title, issue_text, created_by, and optional assigned_to and status_text.
      //The object saved (and returned) will include all of those fields (blank for optional no input) and also include created_on(date/time), updated_on(date/time), open(boolean, true for open, false for closed), and _id.
      var issue = new Issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to,  //optional
        status_text: req.body.status_text,  //optional
        created_on: new Date(),
        updated_on: new Date(),
        open: true,
        project: project
      });
      if (issue.issue_title == '' || issue.issue_text == '' || issue.created_by == '')
        return res.sendStatus(400);
      issue.save((err, doc) => {
        if (err) return res.send(err);
        delete doc.project;
        res.json(doc);
      });     
    })
    
    .put(function (req, res){
      var project = req.params.project;
      //I can PUT /api/issues/{projectname} with a _id and any fields in the object with a value to object said object. Returned will be 'successfully updated' or 'could not update '+_id. This should always update updated_on. If no fields are sent return 'no updated field sent'.
      Issue.findById(req.body._id, (err, issue) => {
        if (err) return res.send('could not update' + req.body._id);
        for (var p in req.body){
          if (req.body[p] != '') {
            if (p == '_id') continue;
            issue[p] = req.body[p];
          }
        };
        issue.updated_on = new Date();
        issue.save((err, doc) => {
          if (err) return res.send(err);
          res.send('successfully updated');
        });         
      });    
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      //I can DELETE /api/issues/{projectname} with a _id to completely delete an issue. If no _id is sent return '_id error', success: 'deleted '+_id, failed: 'could not delete '+_id. 
      Issue.findById(req.body._id, (err, issue) => {      
        if (err) return res.send('_id error');
        Issue.findByIdAndDelete(req.body._id, (err, issue) => {
          if (err) return res.send('could not delete' + req.body._id);
          res.send('deleted ' + req.body._id);
        });
      });
    });
    
};
