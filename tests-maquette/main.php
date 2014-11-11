<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="">
	<meta name="author" content="">

	<title>Matchmaking</title>

	<link rel="stylesheet" href="../public/css/theme-bootstrap.min.css">
	<link rel="stylesheet" href="../public/css/style.css">
	<link rel="stylesheet" href="../public/css/jquery-ui-1.10.4.custom.min.css">
	<link rel="stylesheet" href="../public/css/font-awesome.min.css">

	<script src="../public/js/jquery-2.1.0.min.js"></script>
	<script src="../public/js/jquery-ui-1.10.4.custom.min.js"></script>
	<script src="../public/js/bootstrap.min.js"></script>
</head>

<body>

	<div class="container">

		<div id="content">

			<script type="text/javascript">
				$(function () {
					$('#modal_loading').modal({
						show: 'true',
						keyboard: 'false',
						backdrop: 'static'
					});

				});
			</script>

			<?php

			//require('loading.php');
			//require('first.php');
			require('create.php');
			?>

		

		</div>

	</body>
	</html>

