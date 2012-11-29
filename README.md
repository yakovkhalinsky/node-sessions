An easy to use sessions module for node.js

See the provided example_server.js for a HOW-TO.

This node.js module depends on a couple of other libraries:
* moment.js: http://momentjs.com/
* node-persist: https://github.com/simonlast/node-persist
* router: https://github.com/gett/router
* uuid: https://github.com/broofa/node-uuid

I have included these dependencies in the /lib of this project for convenience.

**INITIALISE EVERYTHING**
<pre><code>var http = require('http');
var moment = require('./lib/moment');

// This is a dependency for the sessions module, which I have included for convenience.
// There may be an updated version (see github link below), but my sessions module is stable
// with the included version.
// Latest version can be found on github here: https://github.com/simonlast/node-persist
// Credit to Simon Last for writing this.
var storage = require('./lib/persist');

var session = require('./lib/sessions');

storage.init({
	dir : '/application_store'
});
</code></pre>

**INITIALISE PROPERTIES OF THE SESSIONS MODULE**
<code>session.init(STORAGE, INITIALISE_SESSIONS_WITH_VALUES, SESSION_OPTIONS)</code>
STORAGE: This is a reference to the initialise persist storage object
INITIALISE_SESSIONS_WITH_VALUES: Use this to set a standard set of key/values to initialise all new sessions with
SESSION_OPTIONS:
- expiryInMinutes (optional): how many minutes should a session last/roll for (default: 30)
- cookieSecret: this is the secret that is used to sign your cookies, please change this!
<pre><code> 
session.init(
	storage, 
	{ authenticated : false, user : null }, 
	{ expiryInMinutes : 5 }
);

http.createServer(function (req, res) {

	// This line below is what creates/restores/expires sessions
	session.checkSession(req);
	// This line must be included to write the session cookie out to the response
	res.setHeader('Set-Cookie', 'session_id=' + req.session_id);	
	
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
	// 'sessionHits' : a standard property that tells us how many hits a session has had
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
  
  	res.writeHead(200, {'Content-Type': 'text/html'});
  	res.end(output);
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');</code></pre>