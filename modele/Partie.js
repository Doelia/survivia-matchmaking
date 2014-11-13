var G = require('./../Includer');

function Partie() {

	this.idPartie;
	this.creator;
	this.participants = new Array();

	this.addParticipant = function(username) {
		if (!this.containParticipant(username)) {
			this.participants.push(username);
			return true;
		}
		return false;
	}

	this.containParticipant = function(username) {
		for (var i in this.participants) {
			if (this.participants[i] == username) {
				return true;
			}
		}
		return false;
	}
	
	this.removeParticipant = function(username) {
		for (var i in this.participants) {
			if (this.participants[i] == username) {
				this.participants[i] = null;
			}
		}
		this.netoyerParticipants();
	}

	this.netoyerParticipants = function() {
		var copy = new Array();
		for (var i in this.participants) {
			var p = this.participants[i];
			if (p != null && G.SessionManager.isConnected(p)) {
				var s = G.SessionManager.getSessionFromName(p);
				if (s.partie != null && s.partie.idPartie == this.idPartie)
					copy.push(p);
			} else {
			}
		}
		this.participants = copy;
	}

}

exports.e = Partie;

