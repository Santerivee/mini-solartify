document.getElementById("login-btn").addEventListener("click", login);

function login() {
    let state = (() => {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";

        for (let i = 0; i < 36; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    })();
    localStorage.setItem("state", state);

    const client_id = "ae780b9e7bf4476285fcfc7475fc2664";
    const redirect_uri = "http://127.0.0.1:5500/index.html";

    const url =
        "https://accounts.spotify.com/authorize" +
        "?response_type=token&scope=streaming playlist-read-collaborative playlist-read-private user-read-private playlist-modify-public playlist-modify-private" +
        "&client_id=" +
        client_id +
        "&redirect_uri=" +
        redirect_uri +
        "&state=" +
        state;

    window.location = url;
}

(function () {
    if (!window.location.hash) return;

    const params = Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)).entries());
    // params = {access_token: string, expires_in: number, token_type: string (Bearer), state: string}

    if (localStorage.getItem("state") !== params["state"]) {
        document.getElementById("error").innerHTML = "unlucky state tbh\n" + localStorage.getItem("state") + "\n" + params["state"];
        return;
    }
    document.getElementById("login-container").style.display = "none";

    class lol {
        constructor() {
            this.error = document.getElementById("error");
            this.album_art = document.getElementById("album-art");
            this.song_name = document.getElementById("song-name");
            this.song_artist = document.getElementById("song-artist");

            this.prev = document.getElementById("prev");
            this.next = document.getElementById("next");

            this.play = document.getElementById("play");
            this.play_img = document.getElementById("play-img");

            this.remove = document.getElementById("remove");

            this.playlist;
            this.song_uri;
            this.play_state;

            this.html = document.querySelector("html");
            this.background = document.getElementById("background");
        }
    }
    const a = new lol();
    const BASEURL = "https://api.spotify.com/v1/";
    const defaultHeaders = [
        ["Authorization", "Bearer " + params["access_token"]],
        ["Content-Type", "application/json"],
        ["Accept", "application/json"],
    ];

    a.prev.addEventListener("click", function () {
        fetch(BASEURL + "me/player/previous", {
            method: "POST",
            headers: defaultHeaders,
        });
    });

    a.play.addEventListener("click", function () {
        if (a.play_state) {
            fetch(BASEURL + "me/player/pause", {
                method: "PUT",
                headers: defaultHeaders,
            });
        } else {
            fetch(BASEURL + "me/player/play", {
                method: "PUT",
                headers: defaultHeaders,
            });
        }
    });

    a.next.addEventListener("click", function () {
        fetch(BASEURL + "me/player/next", {
            method: "POST",
            headers: defaultHeaders,
        });
    });

    a.remove.addEventListener("click", function () {
        fetch(BASEURL + "playlists/" + a.playlist.split(":")[2] + "/tracks", {
            method: "DELETE",
            headers: defaultHeaders,

            body: JSON.stringify({ tracks: [{ uri: a.song_uri }] }),
        })
            .then(() => console.log("skip") /* skip */)
            .catch((e) => a.error.innerHTML(e));
    });

    setInterval(() => {
        fetch(BASEURL + "me/player", {
            headers: defaultHeaders,
        })
            .catch((err) => {
                console.log(err);
            })
            .then((res) => {
                if (res.ok) {
                    return res.json();
                } else if (res.status === 401) {
                    login();
                } else {
                    console.log(res);
                    a.error.innerHTML = res.status + ": " + res.statusText;
                }
            })

            .then((data) => {
                if (data["item"]["uri"] === a.song_uri) return;

                a.album_art.src = data["item"]["album"]["images"][0]["url"];
                a.song_name.innerHTML = data["item"]["name"];
                let artistArr = [];
                for (let i = 0; i < data["item"]["artists"].length; i++) {
                    artistArr.push(data["item"]["artists"][i]["name"]);
                }
                a.song_artist.innerHTML = artistArr.join(", ");

                a.playlist = data["context"]["uri"];
                a.song_uri = data["item"]["uri"];

                a.background.style.background = "no-repeat url(" + data["item"]["album"]["images"][0]["url"] + ")";

                if (data["is_playing"]) {
                    a.play_img.src = "./media/icon_pause.png";
                    a.play_state = true;
                } else {
                    a.play_img.src = "./media/icon_play.png";
                    a.play_state = false;
                }
            })
            .catch((err) => {
                a.error.innerHTML = err;
            });
    }, 2000);
})();