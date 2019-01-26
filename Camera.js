var express = require('express'),
	bodyParser = require('body-parser'),
	path = require('path'),
	socket = require('socket.io');
	// morgan = require('morgan');
	// swal = require('sweetalert2');

var app = express();

// require('./config/passport')(passport,knex); // passport configuration

// set
// app.set('views', path.join(__dirname, 'view')); /* set folder view untuk page-page yang dapat diakses */
// app.set('view engine', 'ejs'); /* set view */

// use
app.use(bodyParser.urlencoded({
	extended: true
}));
// app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(express.static(path.resolve( path.join(__dirname, 'public') ))); /* Cara set folder public untuk page page yang ada*/


app.get('/',function (req,res) {
	res.sendFile(__dirname+'/camera.html');
})

server = app.listen(2020,()=>{
	console.log('running in port 2020')
})
var io = socket(server);

io.on('connection',(socket)=>{
	socket.on('streamingni',(src)=>{
		// console.log(src.stream);
		socket.broadcast.emit('loadstreaming',{stream:src.stream});
	})
	socket.on('streamingstop',()=>{
		console.log('stop')
		socket.broadcast.emit('berhenti',{msg:'streaming berakhir !'})
	})
})