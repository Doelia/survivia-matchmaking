var socket = null;
var delay_fake = 0;

function setCookie(cname,cvalue,exdays) {
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) 
	{
		var c = ca[i].trim();
		if (c.indexOf(name)==0) return c.substring(name.length,c.length);
	}
	return "";
}

function run_app() {
	load_template();
}

function stopAll() {
	socket.close();
	socket = null;
	$('body').html('Force disconnect');
}

function processElements() {

	$('.tip').tooltip({'placement': 'top', 'container': 'body'});
}

function inArray(tab, value) {
	for (var i in tab) {
		if (tab[i] == value)
			return true;
	}
	return false;
}

function removeOfArray(tab, value) {
	for (var i in tab) {
		if (tab[i] == value)
			tab[i] = null;
	}
}

function updateParticipants() {
	console.log(partie);
	$('#participants').html('');
	var cpt =0;
	for (var i in partie.participants) {
		var p = partie.participants[i];
		var added = '';
		added += ('<tr>');
			added += ((partie.creator==p)?'<td><i class="fa fa-gears tip" title="Créateur de la partie"></i></td>':'<td></td>');
			added += ('<td>'+p+'</td>');
			added += ('<td></td>');
		added += ('</tr>');
			
		$('#participants').append(added);
		cpt++;
	}

	for (var i = cpt; i < 4; i++) {
		var added = '';
		added += ('<tr>');
			added += ('<td></td>');
			added += ('<td><i>Place libre. Invitez un membre avec le menu de droite.</i></td>');
			added += ('<td></td>');
		added += ('</tr>');

		$('#participants').append(added);
	}
}

var username = '';
var invitationsPending = new Array();
var partie = null;

function load_home(callback) {
	$.get("base.html", function (data) {
		$("#content").html(data);
		socket.emit('requestConnectedList');
		socket.emit('requestStateContentLeft');
		if (callback) callback();
	});
}

function load_template() {
	load_home(function() {

		socket.on('refresh_connected', function(list) {
			$('.tip').tooltip('hide');
			$('#team_list').html('');
			for (var i in list) {
				var m = list[i];
				var badges = '';
				if (m.isConnected) {
					if (!m.inPartie) {
						badges += '<span class="badge tip" title="Connecté sur l\'interface"><i class="fa fa-dot-circle-o"></i></span>';
						if (partie != null && partie.creator == username && m.username != username && !inArray(partie.participants, m.username)) {
							if (inArray(invitationsPending, m.username)) {
								badges += '<span class="badge alert-warning tip invitePlayer" username="'+m.username+'" title="Invitation envoyée"><i class="fa fa-spinner fa-spin"></i></span>';
							} else {
								badges += '<span style="cursor: pointer;" class="badge alert-success tip invitePlayer" username="'+m.username+'" title="Envoyer une invitation pour cette partie"><i class="fa fa-reply"></i></span>';
							}
						}
					} else {
						badges += '<span class="badge tip alert-warning" title="Dans une partie en préparation"><i class="fa fa-dot-circle-o"></i></span>';
					}
					
				} else {
					badges += '<span class="badge alert-gray tip" title="Hors-ligne"><i class="fa fa-circle-o"></i></span>';
				}
				$('#team_list').append('<li class="list-group-item">'+badges+' '+m.username+'</li>');
			}
			processElements();

			$('.invitePlayer').click(function() {
				var namePlayer = $(this).attr('username');
				if (!inArray(invitationsPending, namePlayer)) {
					invitationsPending.push(namePlayer);
					socket.emit('invite-player', namePlayer);
				}
			});
		});

		socket.on('requestStateContentLeft', function(val) {
			if (val == 'ready') { // Pret pour créer/rejoindre une partie
				$.get("left_ready.html", function (data) {
					$('#left-part').html(data);
					$('#create_partie').click(function() {
						socket.emit('create-partie');
					});
				});
			}
			setTimeout(function() {
				$('#progress_loading').width('100%');
				setTimeout(function() {
					$('#modal_loading').modal('hide');
				}, 300);
			}, delay_fake/3);
		});

		socket.on('partie-preparation', function(json) {
			console.log('recv: artie-preparation')
			invitationsPending = new Array();
			partie = json;
			$.get("left_preparation.html", function (data) {
				$('#left-part').html(data);
				$('#buttons_partie').html();
				if (partie.creator == username) {
					$('#buttons_partie').append('<button type="button" class="btn btn-danger quit-partie">Annuler</button> ');
					$('#buttons_partie').append('<button type="button" class="btn btn-success">Lancer la partie!</button> ');
				} else {
					$('#buttons_partie').append('<button type="button" class="btn btn-danger quit-partie">Quitter</button> ');
				}
				$('.quit-partie').click(function() {
					socket.emit('quit-partie');
				});
				updateParticipants();
				socket.emit('requestConnectedList');
			});
		});

		socket.on('participants-update', function(json) {
			partie = json;
			updateParticipants();
		});

		socket.on('invitation', function(inviteur) {
			$('#nameplayerInvite').html(inviteur);
			$('#modal_invitation').modal({show: 'true',
					keyboard: 'false',
					backdrop: 'static'});
			//$('#modal_invitation').attr('inviteur', inviteur);
			$('#accepteInvitation').click(function() {
				socket.emit('reponse-rejoin', inviteur, true);		
				$('#modal_invitation').modal('hide');		
			});
			$('#refuserInvitation').click(function() {
				socket.emit('reponse-rejoin', inviteur, false);		
				$('#modal_invitation').modal('hide');	
			});
		});

		socket.on('reponse-rejoin', function(usernameInvite, reponse) {
			console.log("réponse de requete");
			socket.emit('requestConnectedList');
			removeOfArray(invitationsPending, usernameInvite);
		});

		socket.on('quit-partie', function() {
			partie = null;
			load_home();
		});

	});
}

function start_loading(login) {
	$('#modal_loading').modal({show: 'true',
						keyboard: 'false',
						backdrop: 'static'});
	$('#progress_loading').width(0);
	setTimeout(function() {
		$('#progress_loading').width('5%');
	}, delay_fake/3);
	setTimeout(function() {
		$('#loading_msg').html('Connexion au web-socket...');
		$('#progress_loading').width('30%');
		socket = io.connect('http://localhost:8080');
		socket.on('connexion_ok', function() {
			setTimeout(function() {
			$('#loading_msg').html('Authentification...');
			$('#progress_loading').width('60%');

			username = login;
			socket.emit('auth_1', {username: username, key: '4654654'});
			socket.on('auth_reponse', function(json, key) {
				setTimeout(function() {
					if (json == 'ok') {
						setCookie('sessionkey', key, 365);
						$('#loading_msg').html('Chargement du contenu de l\'interface...');
						$('#progress_loading').width('90%');
						setTimeout(function() {
							run_app();
						}, delay_fake/3);
					} else {
						$('#loading_body').html('<div class="alert alert-danger" role="alert">Erreur lors de l\'autentification. Veuillez retourner sur le site, vous déconnecter/reconnexion à votre compte puis réésayer.</div>');
					}
				}, delay_fake*2);
			});
		}, delay_fake);
		});
		socket.on('force_disconnect', function() {
			stopAll();
		});
		socket.on('close', function() {
			stopAll();
		});
		socket.on('disconnect', function() {
			stopAll();
		});
	}, delay_fake);
}

$(document).ready(function() {
	start_loading(window.location.hash.substring(1));
	processElements();
});




