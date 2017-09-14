"use strict";
var getURL = function(url) {
    return new Promise(function (resolve, reject) {
        var xhttp = new XMLHttpRequest();
        xhttp.open('GET', url);
        xhttp.send();
        xhttp.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(this.response);
            } else {
                reject(this.statusText);
            }
        }
        xhttp.onerror = function() {
            reject(this.statusText);
        }
    });
}
var render = {
    core: {
        main: document.getElementById("main"),
        links: document.getElementById("links"),
        q: document.getElementById("q"),
        suggestions: document.getElementById("suggestions"),
        startTime: new Date(),
        createHeader: function(tobj) {
            let header = document.createElement("header");
            let h1 = document.createElement("h1");
            let a = document.createElement("a");
            a.innerHTML = tobj['name'] ? tobj['name'] : "Undefined";
            document.title = tobj['name'];
            a.href = tobj['url'];
            h1.appendChild(a);
            header.appendChild(h1);
            this.main.appendChild(header);
        },
        linkDisplay:function(dobj) {
            this.links = document.createElement("div");
            for (let i = 0; i < dobj.length; i++) {
                let o = dobj[i];
                let section = document.createElement("section");
                if (o['title']) {
                    let header = document.createElement("header");
                    let h1 = document.createElement("h1");
                    if (o['title']['url']) {
                        h1.appendChild(this.createLink(o['title']));
                    } else {
                        h1.innerHTML = o['title']['name'];
                    }
                    header.appendChild(h1);
                    section.appendChild(header);
                }
                if (o['links']) {
                    let ul = document.createElement('ul');
                    o['links'].sort(function (a,b) {
                        if (a['name'] < b['name']) {
                            return -1;
                        } else if (a['name'] > b['name']) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    for (let j = 0; j < o['links'].length; j++) {
                        let li = document.createElement('li');
                        li.appendChild(this.createLink(o['links'][j]));
                        ul.appendChild(li);
                    }
                    section.appendChild(ul);
                }
                this.links.appendChild(section);
            }
            this.main.appendChild(this.links);
        },
        createLink: function (linkObject) {
            let a = document.createElement('a');
            a.innerHTML = linkObject['name'];
            a.href = linkObject['url'];
            return a;
        },
        inputSearch: function (data) {
            q.addEventListener("keyup", function (e) {
                if (e.key == "Enter") {
                    e.preventDefault();
                    let firstSuggestion = suggestions.getElementsByTagName("a");
                    if (q.value.length > 0 && firstSuggestion) {
                        window.location = firstSuggestion[0].href;
                    }
                } else {
                    if (q.value.length == 0) {
                        suggestions.style.display = "none";
                    } else {
                        suggestions.style.display = "block";
                        while (suggestions.lastChild) {
                            suggestions.removeChild(suggestions.lastChild);
                        }
                        let ul = document.createElement("ul");
                        let total = 0;
                        for (let i = 0; i < data.length && total < 5; i++) {
                            if (fuzzy_match_simple(q.value, data[i]['name'])) {
                                total++;
                                let li = document.createElement("li");
                                let a = document.createElement("a");
                                a.innerText = data[i]['name'];
                                a.href = data[i]['url'];
                                li.appendChild(a);
                                ul.appendChild(li);
                            }
                        }
                        if (total == 0) {
                            let li = document.createElement("li");
                            let a = document.createElement("a");
                            a.innerText = `Search: ${q.value}`;
                            a.href = `https://google.com/search?q=${q.value}`;
                            li.appendChild(a);
                            ul.appendChild(li);
                        }
                        suggestions.appendChild(ul);
                    }
                }
            }, false);
        }
    },
    all:function (data) {
        let odata = JSON.parse(data);
        this.core.createHeader(odata['title']);
        this.core.linkDisplay(odata['display']);
        let combined = odata['hidden'];
        for (let i = 0; i < odata['display'].length; i++) {
            combined = combined.concat(odata['display'][i]['links']);
        }
        this.core.inputSearch(combined);
    }
}
var j = getURL("links.json").then(function (data) {render.all(data)});
function fuzzy_match_simple(pattern, str) {
    var patternIdx = 0;
    var strIdx = 0;
    var patternLength = pattern.length;
    var strLength = str.length;

    while (patternIdx != patternLength && strIdx != strLength) {
        var patternChar = pattern.charAt(patternIdx).toLowerCase();
        var strChar = str.charAt(strIdx).toLowerCase();
        if (patternChar == strChar)
            ++patternIdx;
        ++strIdx;
    }

    return patternLength != 0 && strLength != 0 && patternIdx == patternLength ? true : false;
}
