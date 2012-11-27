/**
 * Yakov Khalinsky http://ninebyt.es
 * Created: 2012-10-29
 * File: session.js
 */
exports.KEY_EXPIRY = 'expiry';
exports.KEY_START = 'start';
exports.KEY_SESSION_HITS = 'sessionHits';
exports.KEY_LAST_SESSION_HIT = 'lastSessionHit';

var uuid = require('./uuid');
var moment = require('./moment');
var crypto = require('crypto');
var defaultExpiryInMinutes = 30;

/**
 * The is the secret that session cookies will be signed with, change this!
 **/
var cookieSecret = 'what a lovely bunch of coconuts';

var initialiseWithProperties = { 
	isSessionObject : true, 
	sessionHits : 0,
	lastSessionHit : null 
}; 

var sessionOptions = {
	expiryInMinutes : defaultExpiryInMinutes 
};

var session_store = null;

exports.init = function(storage, initialProperties, initSessionOptions) {
	session_store = storage;
	for (key in initialProperties) {
		initialiseWithProperties[key] = initialProperties[key]; 	
	}
	if (initSessionOptions) {
		for (key in initSessionOptions) {
			sessionOptions[key] = initSessionOptions[key]; 	
		}
	}
}

// main session function called inside a HTTP method to create or continue a session
// param: req, Requst object 
exports.checkSession = function(req) {
	tidy();	// tidy up expired sessions

	restore(req);	// attempt to continue existing session
	
	var expiry = exports.get(req, exports.KEY_EXPIRY);
	if (moment().diff(expiry) < 0) {	// session is still active
		roll(req);	// roll the session forward
	} else {
		console.log('session is expired: removing session');
		console.log('** removed session: ' + req.session_id + ' **');
		remove(req.session_id);
		req.session_id = create(req, null);	// expire the current session and create a new session
	}
}

function remove(session_id) {	// remove expired sessions
	session_store.removeItem(session_id);
}

function roll(req) {	// update the session expiry time so we can keeping rolling along our session
	exports.set(req, exports.KEY_EXPIRY, moment().add('minutes', sessionOptions.expiryInMinutes));
	var sessionHits = exports.get(req, [exports.KEY_SESSION_HITS]);
	exports.set(req, exports.KEY_SESSION_HITS, ++sessionHits);
	exports.set(req, exports.KEY_LAST_SESSION_HIT, moment());
}

function restore(req) {
	create(req, restoreCookie(req));
}

function restoreCookie(req) {
	var session_id = null;
 	if (req.headers && req.headers.cookie) {
	  	req.headers.cookie.split(';').forEach(function(cookie) {
	    	var parts = cookie.split('=');
	    	if (parts[0].trim() == 'session_id') {
	    		session_id = parts[1].trim(); 
	    		return;
	    	}
	  	});
 	}
 	return session_id;
}

function sign(session_id) {
	if (undefined == session_id || null == session_id) {
		session_id = uuid.v4();
	}
	// sign the cookies
	return session_id + '.' + crypto.createHmac('sha256', cookieSecret)
		.update(session_id)
		.digest('base64')
		.replace(/=+$/, '');
}

function create(req, session_id) {
	if (null == session_id) {	// generate one if we don't have it
		session_id = sign(null);
	} else {	// check the cookie to see if it has been tampered with
		if (session_id == sign(session_id.slice(0, session_id.lastIndexOf('.')))) {
			// cookie is fine, no tampering
		} else {
			// cookie has been tampering, signing comparison has failed
			session_id = sign(null);	// force creation of a new session
		}
	}
	req.session_id = session_id;
	if (session_store.getItem(req.session_id)) {
		// already have a store for this session id
	} else {
		// initialise session object
		var session = { };
		for (key in initialiseWithProperties) {	// add default properties to session object
			session[key] = initialiseWithProperties[key]; 
		}
		session[exports.KEY_START] = moment();	// initialise session start
		session[exports.KEY_LAST_SESSION_HIT] = moment();	// initialise last session hit
		session[exports.KEY_EXPIRY] = moment().add('minutes', sessionOptions.expiryInMinutes);	// initialise session expiry
		session_store.setItem(req.session_id, session);
		console.log('created new session object for session_id: ' + req.session_id);
	 	session_store.persist();	// save session object to store
	}
}

// set an attribute for the session
exports.set = function(req, attribute, value) {
	try {
		session_store.getItem(req.session_id)[attribute] = value;
		return true;
	} catch (e) {
		return false;
	}
}
 
// get an attribute for the session
exports.get = function(req, attribute) {
	try {
		return session_store.getItem(req.session_id)[attribute];
	} catch (e) {
		return null;
	}
}

function tidy() {
	var key;
	var o;
	for (var i=0; i < session_store.length(); i++) {
		key = session_store.key(i);
		if (null != key) {
			o = session_store.getItem(key);
			if (o.isSessionObject) {
				if (moment().diff(o.expiry) > 0) {	// this session object is expired, clean it up
					remove(key);
					console.log('cleaned up expired session: ' + key);
				}								
			} 
		}
	}
}