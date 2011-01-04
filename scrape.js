#!/usr/bin/env node
var jsdom  = require("./lib/jsdom/lib/jsdom"),
    window = jsdom.jsdom().createWindow(),
    fs = require('fs'),
    sys = require('sys'),
    net = require('net'),
    repl = require('repl'),
    PHP_JS = require('./lib/entitieshandler'),
    argv = require('optimist')
      .default('c', './cable')
      .argv

// use PHP port of HTML entity decoder
var decoder = new PHP_JS.PHP_JS({'window': window})

// use a state hash for variables we might want to make available for
// debugging via a REPL
var state = {}

// start REPL if desired
if (argv['r']) {
  // start REPL so we can telnet in and check progress
  net.createServer(function (socket) {
    repl.start('scrape> ', socket).context.state = state
  }).listen(5001);
}

var cable_directory = argv['c']
var cable_paths =     []
var max_open_files =  25

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

          if (fs.statSync(file).isFile()) {
            cable_paths.push(file)
            if (argv['s']) {
              sys.puts('Found ' + cable_paths.length + ' cable files.')
            }
          }
        }
      }
    }
  }
}

// cycle through files, processing asynchronously
var data = {'cables': {}}
state.cables_to_process = []
state.open_files =      0
state.errors = []
state.failed_removals = 0

function remove_cable_from_todo_list(cable_path) {

  // remove cable from array of cables that need to be processed
  var cable_index = state.cables_to_process.indexOf(cable_path)
  if (state.cables_to_process[cable_index] != undefined) {
    state.cables_to_process.splice([cable_index], 1)
    if (argv['s']) {
      sys.puts('Cables to process: ' + state.cables_to_process.length + ' / Open files: ' + state.open_files)
    }
  }
  else {
    state.failed_removals++
    if (argv['s']) {
      sys.puts('Failed removal')
    }
  }
}

for (var index in cable_paths) {

  var cable_path = cable_paths[index]
  state.cables_to_process.push(cable_path)

  // create closure to preserve cable_path
  var closure = function(cable_path) {

    // don't attempt processing if too many files are open
    if (state.open_files < max_open_files) {

      // get cable web page HTML and extract filename from path
      var html = fs.readFileSync(cable_path)
      var cable_filename = cable_path.split('/')[cable_path.split('/').length - 1]

      var error = false

      // set up virtual window DOM
      try {
        var document = jsdom.jsdom(html)
      } catch(error) {
        state.errors.push(cable_filename + ': ' + error.message)
      }

      if (!error && (document != undefined)) {

        var window = document.createWindow()

        // JQueryify opens a file when it includes Jquery
        state.open_files++

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

          state.open_files--
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

  closure(cable_path)
}

// wait for all cables to be processed then output JSON
function wait() {

  process.nextTick(function() {
    if ((state.cables_to_process.length - state.failed_removals) > 0) {
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
  })
}
wait()
