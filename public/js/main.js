var socket = null;
var delay_fake = 1000;

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

function create_alert(message, type) {
	var button = '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>';
	var created = $('<div class="alert alert-'+type+' fade in" style="display: none;" role="alert">'+button+message+'</div>');
	$('#logs').append(created);
	created.show();
}

function run_app() {
	load_template();
}

function stopAll(msg) {
	if (!msg)
		msg = 'Force disconnect';
	socket.close();
	socket = null;
	$('body').html(msg);
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

function modal_error(msg) {
	$('#body_error').html(msg);
	$('#modal_error').modal({show: 'true'});
}

function start_game() {
	if (partie != null) {
		if (partie.participants.length == 4) {

		} else {
			modal_error("Cette partie doit comporter 4 participants avant de pouvoir être lancée");
		}
	} else {
		stopAll('Crash interface. Erreur : Tentative de lancement d\'une partie introuvable');
	}
}

function updateParticipants() {
	//console.log(partie);
	if (partie != null) {
		$('#participants').html('');
		var cpt =0;
		for (var i in partie.participants) {
			var p = partie.participants[i];
			var added = '';
			var avatar = '<img class="avatar" src="https://minotar.net/avatar/'+p+'/15.png" />';
			added += ('<tr>');
				added += ((partie.creator==p)?'<td><i class="fa fa-gears tip" title="Créateur de la partie"></i></td>':'<td></td>');
				added += ('<td>'+avatar+' '+p+'</td>');
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
				var avatar = '<img class="avatar" src="https://minotar.net/avatar/'+m.username+'/20.png" />';
				$('#team_list').append('<li class="list-group-item">'+badges+' '+avatar+' '+m.username+'</li>');
			}
			processElements();

			$('.invitePlayer').unbind('click').click(function() {
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
					$('#create_partie').unbind('click').click(function() {
						$('#modal_loading_partie_creation').modal({show: 'true',
						keyboard: 'false',
						backdrop: 'static'});

						setTimeout(function() {
							socket.emit('create-partie');
						}, delay_fake*2);
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
			console.log('recv: partie-preparation');
			$('#logs').html('');
			invitationsPending = new Array();
			partie = json;
			$.get("left_preparation.html", function (data) {
				$('#left-part').html(data);
				$('#buttons_partie').html();
				if (partie.creator == username) {
					$('#buttons_partie').append(' <button type="button" class="btn btn-danger quit-partie pull-right tip" title="Annuler cette partie">Annuler  <i class="ml3 fa fa-remove"></i></button> ');
					$('#buttons_partie').append(' <button type="button" class="btn btn-success pull-right mr8 start-partie"> Lancer la partie <i class="ml3 fa fa-play-circle"></i></button> ');
				} else {
					$('#buttons_partie').append('<button type="button" class="btn btn-danger quit-partie pull-right">Quitter  <i class="ml3 fa fa-sign-out"></i></button> ');
					$('#buttons_partie').append('<button type="button" class="btn btn-gray tip mr8 pull-right" style="cursor: default;" title="Seul le créateur peut lancer la partie">Lancer la partie <i class="ml3 fa fa-play-circle"></i></button> ');
				}
				$('.quit-partie').unbind('click').click(function() {
					socket.emit('quit-partie');
				});
				$('.start-partie').unbind('click').click(function() {
					start_game();
				});
					

				updateParticipants();
				socket.emit('requestConnectedList');
				processElements();
				$('#modal_loading_partie_creation').modal('hide');

				if (partie.creator != username) {
					create_alert('Vous avez rejoint la partie de '+partie.creator, 'success');
				}
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

			var fct = function(reponse) {
				socket.emit('reponse-rejoin', inviteur, reponse);		
				$('#modal_invitation').modal('hide');		
			}

			$('#accepteInvitation').unbind('click').click(function() { fct(true)});
			$('#refuserInvitation').unbind('click').click(function() { fct(false)});
		});

		socket.on('reponse-rejoin', function(usernameInvite, reponse) {
			console.log("réponse de requete");
			socket.emit('requestConnectedList');
			removeOfArray(invitationsPending, usernameInvite);
			if (reponse) {
				create_alert(usernameInvite+' a accepté votre invitation', 'success');
			} else {
				create_alert(usernameInvite+' a refusé votre invitation', 'danger');
			}
		});

		socket.on('alert', function(msg, type) {
			create_alert(msg, type);
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




