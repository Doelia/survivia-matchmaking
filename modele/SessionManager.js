var G = require('./../Includer');
var fs = require('fs');

function SessionManager() {

	this.listSessions = new Array();
	this.AI = 0;
	
	this.genAKey = function() {
		this.AI++;
		return "K"+(this.AI);
	};

	this.createSession = function() {
		var s = new G.Session();
		s.key = G.SessionManager.genAKey();
		G.SessionManager.recordSession(s);
		return s;
	};

	this.getSessionFromName = function(username) {
		for (var i in this.listSessions) {
			if (this.listSessions[i].username == username)
				return this.listSessions[i];
		}
		return null;
	}

	this.isConnected = function(username) {
		return (this.getSessionFromName(username) != null);
	}

	this.removeSession = function(s) {
		if (!G.SessionManager.listSessions[s.key])
			return;
		
		if (G.SessionManager.listSessions[s.key].socket != null) {
			G.SessionManager.listSessions[s.key].socket.emit('force_disconnect');
		}
		G.SessionManager.listSessions[s.key] = null;
		delete G.SessionManager.listSessions[s.key];
	}

	this.recordSession = function(s) {
		console.log("Nouvelle sesion : "+s.key);
		G.SessionManager.listSessions[s.key] = s;
	};

	this.getSession = function(p_key) {
		return this.listSessions[p_key];
	};

}

exports.e = new SessionManager();