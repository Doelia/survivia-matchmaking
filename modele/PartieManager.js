var G = require('./../Includer');
var fs = require('fs');

function PartieManager() {

	this.listParties = new Array();
	this.AI = 0;
	
	this.createPartie = function(creator) {
		var s = new G.Partie();
		s.creator = creator;
		s.idPartie = this.AI++;
		G.PartieManager.recordPartie(s);
		return s;
	};

	this.getPartieFromCreator = function(username) {
		for (var i in this.listParties) {
			var p = this.listParties[i];
			if (p && p.creator == username) {
				if (G.SessionManager.isConnected(p.creator)) {
					var s = G.SessionManager.getSessionFromName(p.creator);
					if (s != null && s.partie != null && s.partie.idPartie == p.idPartie) {
						return p;
					}
				}
				G.PartieManager.removePartie(p);
			}
		}
		return null;
	}

	this.cleanParties = function() {
		var copy = new Array();
		for (var i in this.listParties) {
			var p = this.listParties[i];
			if (p != null && G.SessionManager.isConnected(p.creator)) {
				var s = G.SessionManager.getSessionFromName(p.creator);
				if (s.partie != null && s.partie.idPartie == p.idPartie)
					copy.push(p);
			}
		}
		this.listParties = copy;
	}

	this.removePartie = function(s) {
		if (!G.PartieManager.listParties[s.idPartie])
			return;
		G.PartieManager.listParties[s.idPartie] = null;
		delete G.PartieManager.listParties[s.idPartie];
		this.cleanParties();
	}

	this.recordPartie = function(s) {
		G.PartieManager.listParties[s.idPartie] = s;
	};

	this.getPartie = function(idPartie) {
		return this.listParties[idPartie];
	};

}

exports.e = new PartieManager();

