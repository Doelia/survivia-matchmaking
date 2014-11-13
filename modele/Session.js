var G = require('./../Includer');

function Session(p_socket) {

	this.socket = p_socket;
	this.key;
	this.username = null;
	this.team = null;
	this.teamMemberList = [];
	this.socket;
	this.partie = null;

	this.prepareAGame = function() {
		return (this.partie != null);
	}

	this.getAMemberOfTeamRandomConnected = function() {
		for (var i in this.teamMemberList) {
			var name = this.teamMemberList[i];
			if (name != this.username && G.SessionManager.isConnected(name))
				return name;
		}
		return null;
	}

	this.isInGame = function() {
		return false;
	}

}

exports.e = Session;

