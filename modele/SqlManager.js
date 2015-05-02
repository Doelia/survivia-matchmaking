var G = require('./../Includer');
var fs = require('fs');

function SqlManager() {

	this.mySqlClient;

	this.connexion = function(mysql) {
		this.mySqlClient = mysql.createConnection({
		  host     : "localhost",
		  user     : "root",
		  password : "root",
		  database : "survivia"
		});
	}

	this.getTeamOf = function(username, callback) {

		var selectQuery = "SELECT 'Swarius' as name";
 
		var sqlQuery = this.mySqlClient.query(selectQuery);
		 
		sqlQuery.on("result", function(row) {
		  callback(row.name);
		});
		 
		sqlQuery.on("end", function() {
		  //mySqlClient.end();
		});
		 
		sqlQuery.on("error", function(error) {
		  console.log(error);
		  callback(null);
		});

	}
	

}

exports.e = new SqlManager();

