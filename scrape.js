#!/usr/bin/env node
var jsdom  = require("./lib/jsdom/lib/jsdom"),
    window = jsdom.jsdom().createWindow(),
    fs = require('fs'),
    sys = require('sys'),
    PHP_JS = require('./lib/entitieshandler'),
    argv = require('optimist')
      .default('c', './cable')
      .argv

// use PHP port of HTML entity decoder
var decoder = new PHP_JS.PHP_JS({'window': window})

var cable_directory = argv['c']
var cable_paths =     []
var max_open_files =  25
var open_files =      0

// get cable HTML files synchronously
var dir = fs.readdirSync(cable_directory)

for (var index in dir) {

  var childPath = cable_directory + '/' + dir[index]

  if (fs.statSync(childPath).isDirectory()) {
    var childDir = fs.readdirSync(childPath)

    for (var childIndex in childDir) {
      var grandPath = childPath + '/' + childDir[childIndex]

      if (fs.statSync(grandPath).isDirectory()) {
        var grandDir = fs.readdirSync(grandPath)

        for (var grandIndex in grandDir) {
          var file = grandPath + '/' + grandDir[grandIndex]
          cable_paths.push(file)
          if (argv['s']) {
            sys.puts('Found ' + cable_paths.length + ' cable files.')
          }
        }
      }
    }
  }
}

// cycle through files, processing asynchronously
var data = {'cables': {}}
var cables_to_process = []
var errors = []

function remove_cable_from_todo_list(cable_path) {

  // remove cable from array of cables that need to be processed
  var cable_index = cables_to_process.indexOf(cable_path)
  if (cables_to_process[cable_index] != undefined) {
    cables_to_process.splice([cable_index], 1)
    if (argv['s']) {
      sys.puts('Cables to process: ' + cables_to_process.length + ' / Open files: ' + open_files)
    }
  }
}

for (var index in cable_paths) {

  var cable_path = cable_paths[index]
  cables_to_process.push(cable_path)

  // create closure to preserve cable_path
  var closure = function(cable_path) {

    // don't attempt processing if too many files are open
    if (open_files < max_open_files) {

      // get cable web page HTML and extract filename from path
      var html = fs.readFileSync(cable_path)
      var cable_filename = cable_path.split('/')[cable_path.split('/').length - 1]

      var error = false

      // set up virtual window DOM
      try {
        var document = jsdom.jsdom(html)
      } catch(error) {
        errors.push(cable_filename + ': ' + error.message)
      }

      if (!error && (document != undefined)) {

        var window = document.createWindow()

        // JQueryify opens a file when it includes Jquery
        open_files++

        // use JQuery to scrape cable text
        jsdom.jQueryify(window, './lib/jquery-1.4.2.min.js' , function() {
          window.$('pre').each(function(idx, item) {

            // make a spot for the cable in the global container for cables
            if (!data.cables[cable_filename]) {
              data.cables[cable_filename] = []
            }

            // add scraped text to global container
            var content = decoder.html_entity_decode(item.innerHTML)
            content = content.replace(/&#x000A;/g, '<br />');
            data.cables[cable_filename].push(content)

          })

          open_files--

          remove_cable_from_todo_list(cable_path)
        })
      }
      else {

        remove_cable_from_todo_list(cable_path)
      }
    }
    else {

      // let stuff happen then try processing again
      process.nextTick(function() {
        closure(cable_path)
     })
    }
  }

  // initiate processing of cable
  closure(cable_path)
}

// wait for all cables to be processed then output JSON
function wait() {

// process.nextTick(
  setTimeout(function() {
    if (cables_to_process.length > 0) {
      wait()
    }
    else {
      if (argv['-o']) {
        console.log('Saving file...')
        fs.writeFile(argv['-o'], JSON.stringify(data), function (err) {
          if (err) throw err
          console.log('File saved.')
        })
      }
      else {
        sys.puts(JSON.stringify(data))
      }
    }
  }, 100)
}
wait()
