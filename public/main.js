	// Bibliotéques
var G = require('./Includer');
var express = require('express');
var fs = require('fs');
var connect = require('connect');
var app = express();
app.use(connect.cookieParser());

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


var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

	// Le client veut se connecter
	socket.on('connexion', function (json) {

		var retour = G.MembreManager.authMembre(json.mail, json.mdp);

		if (retour) {
			socket.get('session', function (error, session) {
				var s = session;
				s.setMembre(retour.idMembre);
				socket.set('session', s);
				socket.emit('connexion_ok', retour, s.key);
			});
		} else {
			socket.emit('connexion_fail');
		}
	});

	socket.on('invite_membre', function (mailMembre, idSondage) {
		var membre = G.MembreManager.getMembreFromMail(mailMembre);
		if (!membre) {
			console.log("[!] main.js.invite_membre.on() : Membre introuvable : "+mailMembre);
			socket.emit('inviteMembre_reponse', false, idSondage);
		} else {
			socket.emit('inviteMembre_reponse', true, idSondage);
			G.SondageManager.ajouterInvite(idSondage, membre.idMembre);
		}
	});

    socket.on('inviteInGroup', function(idGroupe, mailMembre) {
        var membre = G.MembreManager.getMembreFromMail(mailMembre);
        if (!membre) {
            console.log("[!] main.js.inviteInGroup.on() : Membre introuvable : "+mailMembre);
        } else {
            G.GroupeManager.addMembreToGroupe(membre.idMembre, idGroupe);
        }
    });

    socket.on('leaveGroup', function(idGroupe) {
        socket.get('session', function (error, session) {
            if(session.isConnected()) {
                G.GroupeManager.removeMembreToGroupe(idGroupe, session.idMembre);
            }
        });

    });

    socket.on('rmGroup', function(idGroupe) {
        socket.get('session', function (error, session) {
            if(session.isConnected()) {
                G.GroupeManager.removeGroupe(idGroupe);
            }
        });
    });

});

// Quand on quitte le programme
process.on('SIGINT', function () {
	console.log("Sauvegarde en cours...");
	G.GroupeManager.destruct();
	G.MembreManager.destruct();
	G.SondageManager.destruct();
	G.CommentaireManager.destruct();
	console.log("Données sauvegardée.");
    process.exit(0);
});
