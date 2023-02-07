import express from "express";
import session from "express-session";
import passport from "passport";
import passportFacebook from "passport-facebook";
import fs from "fs";
import {
    google
} from "googleapis";
import {
    authorize
} from "./readFileYt.js";

const app = express();

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportFacebook.Strategy({
    clientID: "1218504085540077",
    clientSecret: "ef7682e6ce0348a595c0939b0e297519",
    callbackURL: "http://localhost:3000/oauth2callbackfacebook",
    profileFields: ['id', 'displayName', 'photos', 'email']
}, (accessToken, refreshToken, profile, done) => {
    console.log(profile);
    return done(null, profile);
}));

const OAuth2 = google.auth.OAuth2

// halaman awal
app.get("/", (req, res) => {
    const oauth2Client = new OAuth2(
        authorize.web.client_id,
        authorize.web.client_secret,
        authorize.web.redirect_uris[0]
    );

    const scopes = [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.force-ssl",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtubepartner",
    ];

    const youtube = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes
    });

    const data = {
        youtube: youtube,
        facebook: "http://localhost:3000/auth/facebook"
    }

    return res.send(data);
});





// untuk auth facebook
app.get("/auth/facebook", passport.authenticate('facebook', {
    scope: 'email'
}));

// untuk callback dari facebook
app.get("/auth/facebook/callback", passport.authenticate('facebook', {
    successRedirect: '/profilefb',
    failureRedirect: '/failedfb'
}))

// untuk callback dari youtube
app.get("/auth/youtube/callback", (req, res) => {
    const oauth2Client = new OAuth2(
        authorize.web.client_id,
        authorize.web.client_secret,
        authorize.web.redirect_uris[0]
    );

    if (req.query.error) {
        return res.redirect('/');
    } else {
        oauth2Client.getToken(req.query.code, (err, token) => {
            if (err) {
                console.error("Error while trying to retrieve access token", err);
                return res.redirect('/');
            }

            req.session.token = token;
            return res.redirect('/profile');
            // return res.redirect('/upload');
        });
    }
});

// untuk profile
app.get("/profile", (req, res) => {
    const oauth2Client = new OAuth2(
        authorize.web.client_id,
        authorize.web.client_secret,
        authorize.web.redirect_uris[0]
    );
    oauth2Client.setCredentials(req.session.token);

    const service = google.youtube({
        version: "v3",
        auth: oauth2Client
    });

    service.channels.list({
        auth: oauth2Client,
        part: 'snippet,contentDetails,statistics',
        mine: true
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var channels = response.data.items;
        if (channels.length == 0) {
            console.log('No channel found.');
        } else {
            res.send(channels);
        }
    });
});

// untuk upload video
app.get("/upload", (req, res) => {
    const oauth2Client = new OAuth2(
        authorize.web.client_id,
        authorize.web.client_secret,
        authorize.web.redirect_uris[0]
    );
    oauth2Client.setCredentials(req.session.token);

    const service = google.youtube({
        version: "v3",
        auth: oauth2Client
    });

    const video = {
        snippet: {
            title: "God Of War Video",
            description: "God Of War Video",
            tags: "God Of War Video",
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
        },
        status: {
            privacyStatus: "private"
        }
    };

    const videoFilePath = "cc.mp4";

    const media = {
        body: fs.createReadStream(videoFilePath)
    };

    service.videos.insert({
        auth: oauth2Client,
        part: Object.keys(video).join(","),
        resource: video,
        media: media
    }, (err, data) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        return res.send(data);
    });
});

const port = 3000;
const host = "localhost";

app.listen(port, host, () => {
    console.log(`Server sedang berjalan pada http://${host}:${port}`);
});