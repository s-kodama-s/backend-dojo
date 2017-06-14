var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var session = require("express-session");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var User = require("./models/user.js");

/*passport.serializeUser(function(id, done) {
   done(null, id);
});*/

mongoose.connect("mongodb://localhost/sample");

//passport.serializeUser(function(id, done) {
passport.serializeUser(function(user, done) {
    //done(null, id);
    done(null, user)
});

passport.deserializeUser(function(user, done) {
/*    User.findById(id, (error, user) => {
        if(error) {
            return done(error);
        }
        done(null, user);
    });*/
    done(null, user);
});

passport.use(
    "local-login",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    }, function(request, username, password, done) {
        process.nextTick(() => {
            User.findOne({ "email": username }, function(error, user) {
                if(error) {
                    return done(error);
                }
                if(!user || user.password != password) {
                    return done(null, false, request.flash("message", "Invalid username or password."));
                }
                return done(null, {
                    id: user.id,
                    name: user.name,
                    role: user.role
                });
            });
        });
    })
);

var authorize = function (role) {
    return function (request, response, next) {
        if (request.isAuthenticated() &&
            request.user.role === role) {
            return next();
        }
        response.redirect("/account/login");
    };
};

// express の実態 Application を生成
var app = express();

// テンプレートエンジンを EJS に設定
app.set("views", "./views");
app.set("view engine", "ejs");

// ミドルウェアの設定
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(flash());
app.use("/public", express.static("public"));

// passport設定
app.use(session({ secret: "some salt", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// ルーティング設定
app.use("/", (function () {
    var router = express.Router();
    router.get("/home/index", function (request, response) {
        response.render("./home/index.ejs");
    });
    router.get("/account/login", function (request, response){
        response.render("./account/login.ejs", { message: request.flash("message") });
    });
    router.post("/account/login", passport.authenticate(
        "local-login", {
            successRedirect: "/account/profile",
            failureRedirect: "/account/login"
        }));
    router.post("/account/logout", authorize("group1"), function (request, response){
        request.logout();
        response.redirect("/home/index");
    });
    router.get("/account/profile", authorize("group1"), function (request, response){
        response.render("./account/profile.ejs", { user: request.user });
    });

    router.options("/parrot.json", function(req, res) {
        console.log(req.method);
        console.log(req.headers);
        console.log(req.body);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(req.body);
    });

    router.post("/parrot.json",
        function(req, res) {
            console.log(req.body);
        },
            passport.authenticate(
                "local-login", {
                    successRedirect: "http://localhost:8000/fed.html",
                    failureRedirect: "http://localhost:8000/login.html"
                })
    );

    router.post('/foobar',
        function(req, res) {
            passport.authenticate('local', function(req,res,info) {})(req,res);
        }
    );

/*    router.post("/parrot.json", function(req, res) {
        console.log(req.body);
        passport.authenticate(
                "local-login", {
                    successRedirect: "http://localhost:8000/fed.html",
                    failureRedirect: "http://localhost:8000/login.html"
                })(req, res)
        }
    );*/

/*    router.post("/parrot.json", function(req, res) {
        console.log(req.method);
        console.log(req.headers);
        console.log(req.body);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(req.body);
    });*/

    return router;
})());


/*
var app = express();
app.use(express.static(__dirname+'/public'));

app.get("/", function(req, res) {
    //res.render('login.html');
    //res.sendFile(__dirname + '/public/login.html');
    res.redirect('http://localhost:8000/');
});
*/

// ログイン認証
/*app.post("/", function(req, res) {
    passport.authenticate("local", {
        successRedirect: ""
    })(req, res);
});*/

app.listen(3001);