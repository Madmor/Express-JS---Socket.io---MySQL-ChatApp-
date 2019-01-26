var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

module.exports = (passport,knex) => {

    passport.serializeUser( (id, done) => {
        done(null, id);
    });

    passport.deserializeUser( (id, done) => {
        done(null, id);
    });

    passport.use(
        'register', new LocalStrategy({ passReqToCallback : true },
        (req, username, password, done) => {
            var body = req.body;
            
            knex('user').where('username',username).then( (rows) => {
                if(rows.length){
                    return done(null, false, req.flash('mess', 'username sudah terdaftar'))
                } else {
                    var newUserMysql = {
                        username: username,
                        password: bcrypt.hashSync(password, null, null),
                        email:body.email,
                        deskripsi:body.deskripsi // use the generateHash function in our user model
                    };
                    knex.insert(newUserMysql).into('user').then( (rows) => {
                        
                        req.session.user = username;
                        
                        return done(null, rows[0]);
                    })
                }
            }, (err) => {
                return done(err)
            })
        })
    );

    passport.use(
        'login',
        new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        (req, username, password, done) => { // callback with email and password from our form
            console.log("0")
            knex('user').where('username',username).then( (rows) => {
                console.log("1")
                if(!rows.length){
                    return done(null, false, req.flash('mess', 'User belum terdaftar.'));
                }
                console.log("2")
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('mess', 'Oops! Password anda salah.')); 
                console.log("3")
                req.session.user = rows[0].username;
                // req.session.foto = rows[0].fotoProfile;
                console.log("4")
                return done(null, rows[0].id);

            }, (err) => { return done(err) })
        })
    );
};