	// Bibliotéques
var G = require('./Includer');
var express = require('express');
var cookieParser = require('cookie-parser')
var fs = require('fs');
var connect = require('connect');
var mysql = require('mysql');
var app = express();
app.use(cookieParser());

G.SqlManager.connexion(mysql);

var server = app.listen(8080);

// Fichier CSS
app.get('/css/:file.css', function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/css'});
	var path = 'public/css/'+req.params.file+'.css';
	res.write(fs.readFileSync(path, 'utf8'));
	res.end();
});

// Fichier JS
app.get('/:file.js', function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/javascript'});
	res.write(fs.readFileSync('public/js/'+req.params.file+'.js', 'utf8'));
	res.end();
});

// Fichier font
app.get('/fonts/:file', function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/javascript'});
	res.write(fs.readFileSync('public/fonts/'+req.params.file, 'utf8'));
	res.end();
});

// Le client demange le template (défaut à l'ouverture de la page)
app.get('/', function (req, res) {
	res.render('template.ejs');
});

app.get('/base.html', function (req, res) {
	var key = req.cookies.sessionkey;
	var s = G.SessionManager.getSession(key);

	if (!s) {
		logError('Session introuvable pour get base.html');
		return;
	}

	res.render('base.ejs', {
		session: s
    });
});

app.get('/left_ready.html', function (req, res) {
	res.render('left_ready.ejs', {
    });
});

app.get('/left_preparation.html', function (req, res) {
	res.render('left_preparation.ejs', {
    });
});


function valid_key(username, key) {
	return true;
}

function isInGame(username) {
	return false;
}

function isConnected(username) {

}

function updateConnectedOfTeam(session) {
	if (!session) {
		logError('Session introuvable pour updateConnectedOfTeam()');
		return;
	}

	if (session.team != null) {
		var list = session.teamMemberList;
		for (var i in list) {
			if (G.SessionManager.isConnected(list[i]))
			sendListConnected(list[i]);
		}
	}
}

function sendListConnected(username) {
	
	var session = G.SessionManager.getSessionFromName(username);
	var team = session.teamMemberList;

	var connected = new Array();
	var notConnected = new Array();
	for (var i in team) {
		var isConnected = G.SessionManager.isConnected(team[i]);
		var json = {
			username: team[i],
			isConnected: isConnected,
			inPartie: (isConnected && G.SessionManager.getSessionFromName(team[i]).partie != null)
		};
		(isConnected?connected:notConnected).push(json);
	}
	var list = connected.concat(notConnected);
	console.log("Envoi de la liste des connectés à "+username);
	session.socket.emit('refresh_connected', list);
}

function sendParticipants(partie) {
	console.log("Envoi des participants de la partie de "+partie.creator);
	for (var i in partie.participants) {
		var s = G.SessionManager.getSessionFromName(partie.participants[i]);
		if (s) {
			console.log("Participants envoyés à "+s.username);
			s.socket.emit('participants-update', partie);
		} else {
			logError('Erreur à lenvoi des participants sur une session');
		}
	}
	
}

function defineSession(socket, username, callback) {
	socket.session.username = username;
	socket.session.teamMemberList = ['Doelia', 'Slymp', 'Rolphy_'];
	G.SqlManager.getTeamOf(username, function(nameTeam) {
		socket.session.team = nameTeam;
		callback();
	});
}

function logError(s) {
	console.log('[!] '+s);
}

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

	console.log("Un client essai de se connecter");

	// On crée une nouvelle session vide (même si pas connecté)
	var session = new G.SessionManager.createSession();
	socket.session = session;
	socket.session.socket = socket;
	socket.emit('connexion_ok', 1);

	socket.on('disconnect', function () {
		if (!socket.session) {
			return;
		}

		var sessionRandom = G.SessionManager.getSessionFromName(socket.session.getAMemberOfTeamRandomConnected());
     	G.SessionManager.removeSession(socket.session);
     	if (socket.session.partie != null) {
     		socket.session.partie.removeParticipant(socket.session.username);
     		sendParticipants(socket.session.partie);
     		socket.session.partie = null;
     	}
     	console.log('déconnecté');
     	if (sessionRandom != null)
     		updateConnectedOfTeam(sessionRandom);
    });

	socket.on('auth_1', function (json) {

		if (!json.username || !json.key) {
			logError('JSON authentification invalide');
			return;
		}

		console.log("auth_1:: Joueur "+json.username+", key "+json.key);
		if (valid_key(json.username, json.key)) {

			if (G.SessionManager.isConnected(json.username)) {
				G.SessionManager.removeSession(G.SessionManager.getSessionFromName(json.username));
				console.log("Session de "+json.username+" supprimée car déjà existante");
			}

			defineSession(socket, json.username, function() {
				updateConnectedOfTeam(session);
				socket.emit('auth_reponse', 'ok', socket.session.key);
			});
			
		} else {
			socket.emit('auth_reponse', 'badkey', false);
			G.SessionManager.removeSession(socket.session);
		}
	});

	socket.on('imingame', function () {
		if (!socket.session || !socket.session.username) {
			logError('session invalide pour paquet imingame');
			return;
		}

		socket.emit('imingame', isInGame(socket.session.username));
	});

	socket.on('requestConnectedList', function() {
		if (!socket.session || !socket.session.username) {
			logError('session invalide pour paquet requestConnectedList');
			return;
		}
		sendListConnected(socket.session.username);
	});

	socket.on('requestStateContentLeft', function() {
		if (!socket.session || !socket.session.username) {
			logError('session invalide pour paquet requestConnectedList');
			return;
		}
		socket.emit('requestStateContentLeft', 'ready');
	});

	socket.on('create-partie', function() {
		if (!socket.session || !socket.session.username) {
			logError('session invalide pour paquet create-partie');
			return;
		}
		console.log(socket.session.username+" crée une nouvelle partie");
		var partie = G.PartieManager.createPartie(socket.session.username);
		partie.addParticipant(socket.session.username);
		socket.session.partie = partie;
		socket.emit('partie-preparation', partie);
		updateConnectedOfTeam(socket.session);
	});

	socket.on('invite-player', function(usernamePlayer) {
		if (!socket.session || !socket.session.username || !usernamePlayer) {
			logError('session invalide pour paquet create-partie');
			return;
		}
		if (!G.SessionManager.isConnected(usernamePlayer)) {
			logError('Tentative dinvitation dun joueur pas connecté');
			return;
		}
		var sp = G.SessionManager.getSessionFromName(usernamePlayer);
		if (sp) {
			if (!sp.isInGame() && !sp.prepareAGame()) {
				sp.socket.emit('invitation', socket.session.username);
			}
		}
		sendListConnected(socket.session.username);
	});

	socket.on('reponse-rejoin', function(usernameQuiAEnvoyeLinvit, reponse) {
		if (!socket.session || !socket.session.username || !usernameQuiAEnvoyeLinvit) {
			logError('session invalide pour paquet create-partie');
			return;
		}

		console.log(socket.session.username+" veut rejoindre la partie de "+usernameQuiAEnvoyeLinvit);

		var sp = G.SessionManager.getSessionFromName(usernameQuiAEnvoyeLinvit);
		if (sp) {
			var partie = G.PartieManager.getPartieFromCreator(usernameQuiAEnvoyeLinvit);
			if (partie) {
				if (reponse) {
					if (partie.addParticipant(socket.session.username)) {
						socket.session.partie = partie;
						socket.emit('partie-preparation', partie);
						console.log(socket.session.username+" rejoin la partie de "+usernameQuiAEnvoyeLinvit);
					}
					sendParticipants(partie);
				} else {
					console.log("mais a refusé");
				}
			} else {
				logError("reponse-rejoin: Partie introuvable");
			}
			console.log('emit reponse-rejoin('+socket.session.username+') @ '+sp.username);
			sp.socket.emit('reponse-rejoin', socket.session.username, reponse);
		} else {
			logError('reponse-rejoin: Session de '+usernameQuiAEnvoyeLinvit+' introuvable');
		}
	});

	socket.on('quit-partie', function() {
		if (!socket.session || !socket.session.username) {
			logError('session invalide pour paquet quit-partie');
			return;
		}

		console.log('quit-partie de '+socket.session.username);

		if (socket.session.prepareAGame()) {
			var p = socket.session.partie;
			if (p.creator == socket.session.username) { // On supprime la partie + on kick tout le monde
				console.log(socket.session.username+" supprime sa partie");
				p.netoyerParticipants();
				// On kick tout le monde
				for (var i in p.participants) {
					console.log("Kick de "+p.participants[i]+" de la partie...")
					var s = G.SessionManager.getSessionFromName(p.participants[i]);
					s.partie = null;
					s.socket.emit('quit-partie');
					if (s.username != socket.session.username) {
						setTimeout(function() {
							s.socket.emit('alert', 'La partie a été annulée par son créateur', 'danger');
						}, 200);
					}
				}
				G.PartieManager.removePartie(p);
				console.log("Partie supprimée");
			} else { // On vire juste le mec de la partie
				console.log(socket.session.username+" quitte sa partie");
				socket.session.partie.removeParticipant(socket.session.username);
				sendParticipants(socket.session.partie);
				for (var i in p.participants) {
					var s = G.SessionManager.getSessionFromName(p.participants[i]);
					s.socket.emit('alert', socket.session.username+' a quitté la partie', 'danger');
				}
			}
			socket.session.partie = null;
			socket.emit('quit-partie');
			updateConnectedOfTeam(socket.session);
		}

	});


});

// Quand on quitte le programme
process.on('SIGINT', function () {
	console.log("Sauvegarde en cours...");
	console.log("Données sauvegardée.");
    process.exit(0);
});
