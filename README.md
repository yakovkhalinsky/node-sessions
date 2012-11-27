An easy to use sessions module for node.js

See the provided example_server.js for a HOW-TO.

This node.js module depends on a couple of other libraries:
moment.js: http://momentjs.com/
node-persist: https://github.com/simonlast/node-persist

I have included these dependencies in the /lib of this project for convenience.

<pre><code>var http = require('http');

// This is a dependency for the sessions module, which I have included for convenience.
// There may be an updated version (see github link below), but my sessions module is stable
// with the included version.
// Latest version can be found on github here: https://github.com/simonlast/node-persist
// Credit to Simon Last for writing this.
var storage = require('./lib/persist');

var storage = require('./lib/sessions');

storage.init({
	dir : '/application_store'
});

// You must include the 'storage' when calling init for the sessions module.
// The second object is an object with key/values that are always initialised into every session.
// The third argument (which is optional) sets the number of minutes a session lasts/rolls for.
// NOTE: Session expiry defaults to 30 minutes (you can also change this in sessions.js). 
session.init(
	storage, 
	{ authenticated : false, user : null }, 
	{ expiryInMinutes : 5 }
);

http.createServer(function (req, res) {

	// This line below is what creates/restores/expires sessions
	session.checkSession(req, res);
	
	// EXAMPLE SETTERS
	// You can use anything that can be stored in valid JSON
	session.set(req, 'myVal', 'value');
	session.set(req, 'myNum', 12345);
	session.set(req, 'myBool', true);
	session.set(req, 'myDoc', { foo : 'bar' });
	session.set(req, 'myArray', [ 1234, 43423, 654654 ]);
	
	// EXAMPLE GETTER
	session.get(req, 'myVal');
	
	// STANDARD PROPERTIES IN A SESSION
	// req.session_id is created by the session.checkSession() call
	// 'sessionHits' : a standard session that tells us how many hits a session has had
	// 'start' : when a session was started
	// 'expiry' : when a session is set to expire
	// 
	// NOTE: I just use moment.js to add a bit more functionality to the 'start' and 'expire' properties.
	var output = '';
	output += '<p>got session_id: ' + req.session_id + '</p>';
	output += '<p>session hits: ' + session.get(req, 'sessionHits') + '</p>';
	output += '<p>session started: ' + moment(session.get(req, 'start')).fromNow() + '</p>';
	output += '<p>session will expire: ' + moment(session.get(req, 'expiry')).fromNow() + '</p>';
	output += '<p>THE END</p>';
  
  	res.writeHead(200, {'Content-Type': 'text/plain'});
  	res.end(output);
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');</code></pre>