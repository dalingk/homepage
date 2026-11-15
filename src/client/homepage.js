"use strict";

class FuzzySearch {
    constructor(item) {
        this.linkItem = item;
        this.name = this.linkItem.name;
        this.results = [];
    }
    collapseResults(results, termLen) {
        if (results.length == termLen) {
            let resultIDX = 0;
            let tempLen = results.length;
            let start;
            while (resultIDX < tempLen) {
                start = resultIDX;
                while (
                    resultIDX + 1 < tempLen &&
                    results[resultIDX] + 1 == results[resultIDX + 1]
                ) {
                    resultIDX++;
                }
                this.results.push({
                    start: results[start],
                    end: results[resultIDX],
                });
                resultIDX++;
            }
            this.linkItem.update(this.results);
            return this.results;
        } else {
            return false;
        }
    }
    search(term) {
        let tempResults = [];
        this.results = [];

        let nameIDX = 0;
        let nameLen = this.name.length;

        let termIDX = 0;
        let termLen = term.length;

        let nameChar = "";
        let termChar = "";
        while (nameIDX < nameLen && termIDX < termLen) {
            nameChar = this.name.charAt(nameIDX).toLowerCase();
            termChar = term.charAt(termIDX).toLowerCase();
            if (nameChar == termChar) {
                tempResults.push(nameIDX);
                ++termIDX;
            }
            ++nameIDX;
        }
        return this.collapseResults(tempResults, termLen);
    }
    element() {
        return this.linkItem.element();
    }
    get url() {
        return this.linkItem.url;
    }
    reset() {
        this.linkItem.reset();
    }
}

class LinkItem {
    constructor(data) {
        this.name = data.name;
        this.url = data.url;
        this.search = new FuzzySearch(data.name);
        this.content = null;
        this.targets = [];
        this.update();
    }
    element() {
        let temp = this.content.cloneNode(true);
        this.targets.push(temp);
        return temp;
    }
    textSnip(start, end) {
        return document.createTextNode(this.name.substring(start, end));
    }
    update(results) {
        let text = document.createDocumentFragment();
        if (results) {
            let nameIDX = 0;
            for (let i = 0; i < results.length; i++) {
                let { start, end } = results[i];

                text.appendChild(this.textSnip(nameIDX, start));

                let strong = document.createElement("strong");
                strong.appendChild(this.textSnip(start, end + 1));
                text.appendChild(strong);

                nameIDX = end + 1;
            }
            if (nameIDX < this.name.length)
                text.appendChild(this.textSnip(nameIDX, this.name.length));
        } else {
            text.appendChild(document.createTextNode(this.name));
        }
        this.content = this.rootNode();
        this.content.appendChild(text);
        this.targets = this.targets.filter((target) =>
            document.body.contains(target),
        );
        this.targets = this.targets.map((target) => {
            let newNode = this.content.cloneNode(true);
            target.parentNode.replaceChild(newNode, target);
            return newNode;
        });
    }
    rootNode() {
        let result = null;
        if (this.url) {
            result = document.createElement("a");
            result.href = this.url;
        } else {
            result = document.createElement("span");
        }
        return result;
    }
    reset() {
        this.update();
    }
}

class LinkHeader {
    constructor(data) {
        this.content = new LinkItem(data);
    }
    element() {
        let header = document.createElement("header");
        let h1 = document.createElement("h1");
        h1.appendChild(this.content.element());
        header.appendChild(h1);
        return header;
    }
    get name() {
        return this.content.name;
    }
}

class LinkGroup {
    constructor(group) {
        this.header = new LinkHeader(group.title);
        this.links = group.links.map((item) => new LinkItem(item));
        this.links.sort((a, b) => {
            let aLower = a.name.toLowerCase();
            let bLower = b.name.toLowerCase();
            if (aLower < bLower) return -1;
            else if (aLower == bLower) return 0;
            else return 1;
        });
    }
    element() {
        let section = document.createElement("section");
        section.appendChild(this.header.element());

        let linkContent = document.createElement("ul");
        this.links.map((link) => {
            let li = document.createElement("li");
            li.appendChild(link.element());
            linkContent.appendChild(li);
        });
        section.appendChild(linkContent);

        return section;
    }
    get items() {
        return this.links;
    }
}

class LinkSearch {
    constructor(searchItems) {
        this.wrapper = document.createElement("section");
        this.wrapper.classList.add("input");

        let form = document.createElement("form");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (this.results.length > 0 && this.input.value.length > 0) {
                window.location = this.results[0].url;
            }
        });
        this.input = this.createInput();
        form.appendChild(this.input);
        this.wrapper.appendChild(form);

        this.suggestions = document.createElement("div");
        this.suggestions.id = "suggestions";
        this.wrapper.appendChild(this.suggestions);
        this.searchArray = searchItems.map((item) => new FuzzySearch(item));
        this.results = [];

        window.addEventListener("keydown", (e) => {
            if (e.target != this.input) {
                this.input.focus();
            }
        });
        window.addEventListener("click", (e) => {
            if (
                !this.suggestions.contains(e.target) &&
                e.target != this.input
            ) {
                this.suggestions.style.display = "none";
            }
        });
    }
    element() {
        return this.wrapper;
    }
    createInput() {
        let input = document.createElement("input");
        input.type = "text";
        input.name = "q";
        input.autocomplete = "off";
        input.addEventListener("focus", (e) => {
            this.suggestions.style.display = "block";
            e.target.select();
        });
        input.addEventListener("input", () => this.search(this.input.value));
        return input;
    }
    search(term) {
        this.results.map((item) => item.reset());
        if (this.input.value.length > 0) {
            this.results = this.searchArray.filter((item) => item.search(term));
            this.results.push(
                new LinkItem({
                    name: `Search: ${term}`,
                    url: `https://www.google.com/search?q=${term}`,
                }),
            );
        } else {
            this.results = [];
            this.suggestions.style.display = "none";
        }
        let list = document.createElement("ul");
        this.results.map((item) => {
            let li = document.createElement("li");
            li.appendChild(item.element());
            list.appendChild(li);
        });
        let fresh_suggestions = document.createElement("div");
        fresh_suggestions.id = "suggestions";
        fresh_suggestions.appendChild(list);
        this.wrapper.replaceChild(fresh_suggestions, this.suggestions);
        this.suggestions = fresh_suggestions;
    }
}

class LinkDisplay {
    constructor(links) {
        let displayed = links.display.map((group) => new LinkGroup(group));
        let hidden = links.hidden.map((hiddenLink) => new LinkItem(hiddenLink));
        let allItems = displayed
            .reduce((acc, group) => acc.concat(group.links), [])
            .concat(hidden);
        this.title = document.createElement("title");
        this.main = document.createElement("main");
        this.search = new LinkSearch(allItems);

        let header = new LinkHeader(links.title);

        this.main.appendChild(this.search.element());
        this.main.appendChild(header.element());

        let linkDiv = document.createElement("div");
        linkDiv.id = "links";
        displayed.map((group) => linkDiv.appendChild(group.element()));
        this.main.appendChild(linkDiv);

        this.title.appendChild(document.createTextNode(header.name));
        document.head.appendChild(this.title);

        document.body.appendChild(this.main);
    }
}

class WeatherApi {
    constructor() {
        this.latitude = localStorage.getItem("latitude");
        this.longitude = localStorage.getItem("longitude");
        this.divs = { temperature: null, sunrise: null, sunset: null };
    }
    getCachedData(dataType, durationMS) {
        let stored = localStorage.getItem(dataType);
        if (!stored) return null;
        const data = JSON.parse(stored);
        if (new Date().getTime() - new Date(data.date) > durationMS)
            return null;
        return data.data;
    }
    setCachedData(dataType, data) {
        localStorage.setItem(
            dataType,
            JSON.stringify({ date: new Date(), data: data }),
        );
    }
    async fetchPoints() {
        // Cache for an hour (3600000 milliseconds)
        let cached = this.getCachedData("points", 3600000);
        if (cached) return cached;

        const response = await fetch(
            `https://api.weather.gov/points/${this.latitude},${this.longitude}`,
            { headers: { Accept: "application/geo+json" } },
        );
        if (!response.ok) throw "Failed to fetch weather points";
        const json = await response.json();
        this.setCachedData("points", json);
        return json;
    }
    async forecastHourly() {
        const points = await this.fetchPoints();
        const url = points?.properties?.forecast;
        if (!url) {
            throw "Unable to find hourly forecast URL in points response";
        }
        const response = await fetch(url);
        if (!response.ok) throw "Failed to fetch hourly forecast";
        return await response.json();
    }
    async observationLatest() {
        const points = await this.fetchPoints();
        const stationsUrl = points?.properties?.observationStations;
        if (!stationsUrl) {
            throw "Unable to find hourly forecast URL in points response";
        }
        const stationsResponse = await fetch(stationsUrl);
        if (!stationsResponse.ok) throw "Failed to fetch observation stations";
        for (const stationUrl of (await stationsResponse.json())
            ?.observationStations) {
            const observationResponse = await fetch(
                `${stationUrl}/observations/latest`,
            );
            if (!observationResponse.ok) continue;
            const data = await observationResponse.json();
            // Check that this station is reporting temperature otherwise use the next one
            if (data?.properties?.temperature?.value === null) continue;
            return data;
        }
    }
    async sunriseSunset() {
        const data = await this.fetchPoints();
        const { sunrise, sunset } = data?.properties?.astronomicalData;
        return { sunrise, sunset };
    }
    async forecast() {
        // const hourlyForecast = await this.forecastHourly();
        const observation = await this.observationLatest();
        console.log(observation);
    }
    createDiv(purpose) {
        const newDiv = document.createElement("div");
        newDiv.id = `display${purpose}`;
        newDiv.addEventListener("click", this.registerLatLong.bind(this));
        return newDiv;
    }
    async display() {
        const temperatureFormatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 0,
        });
        const dateFormatter = new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        });
        const temperatureDiv = this.createDiv("temperature");
        const sunriseDiv = this.createDiv("sunrise");
        const sunsetDiv = this.createDiv("sunset");

        const hasCoordinates =
            this.latitude !== null && this.longitude !== null;
        if (hasCoordinates) {
            const { sunrise, sunset } = await this.sunriseSunset();
            const observation = await this.observationLatest();
            const temperature = observation?.properties?.temperature?.value;
            const { stationId } = observation?.properties;
            if (temperature === null || isNaN(temperature)) {
                temperatureDiv.innerText = "Temperature error";
            } else {
                const temperatureString = temperatureFormatter.format(
                    temperature * 1.8 + 32,
                );
                temperatureDiv.innerText = `${stationId}: ${temperatureString} \u00B0F`;
            }
            sunriseDiv.innerText = `${dateFormatter.format(new Date(sunrise))}`;
            sunsetDiv.innerText = `${dateFormatter.format(new Date(sunset))}`;
        } else {
            temperatureDiv.innerText = "No lat,long!";
        }

        for (let [sentinel, newDiv, oldDiv] of [
            [true, temperatureDiv, "temperature"],
            [hasCoordinates, sunriseDiv, "sunrise"],
            [hasCoordinates, sunsetDiv, "sunset"],
        ]) {
            if (!sentinel) continue;
            if (this.divs[oldDiv]) {
                document.querySelector("#topbar").replaceChild(newDiv, this.divs[oldDiv]);
            } else {
                document.querySelector("#topbar").appendChild(newDiv);
            }
            this.divs[oldDiv] = newDiv;
        }
    }
    registerLatLong() {
        const newLat = prompt("Latitude?");
        const newLong = prompt("Longitude?");
        if (newLat === null || newLong === null) return;
        this.latitude = newLat;
        window.localStorage.setItem("latitude", newLat);
        this.longitude = newLong;
        window.localStorage.setItem("longitude", newLong);
        this.display();
    }
}

class AqiWidget {
    aqiCategoryMap = {
        Good: 1,
        Moderate: 2,
        "Unhealthy for Sensitive Groups": 3,
        Unhealthy: 4,
        "Very Unhealthy": 5,
        Hazardous: 6,
    };
    constructor() {
        this.zip = window.localStorage.getItem("zip");
        this.div = null;
    }
    createDiv() {
        const div = document.createElement("div");
        div.id = "displayAqi";
        div.addEventListener("click", this.registerZip.bind(this));
        return div;
    }
    registerZip() {
        const newZip = prompt("Zip code?");
        if (newZip === null) {
            return;
        } else if (newZip.match(/\d{5}/)) {
            this.zip = newZip;
            window.localStorage.setItem("zip", newZip);
        } else {
            window.localStorage.removeItem("zip");
            this.zip = "";
        }
        this.display();
    }
    async display() {
        const newDiv = this.createDiv();
        if (!this.zip) {
            newDiv.appendChild(new Text("AQI?"));
            newDiv.classList.add("no-zip");
        } else {
            const aqiData = await this.getAqi();
            const {
                nowcastAQI: aqi,
                parameterName: parameter,
                aqiCategoryName: categoryName,
            } = aqiData[0];
            newDiv.appendChild(new Text(`${parameter}: ${aqi}`));
            if (this.aqiCategoryMap.hasOwnProperty(categoryName)) {
                newDiv.classList.add(
                    `aqi-${this.aqiCategoryMap[categoryName]}`,
                );
            }
            newDiv.title = categoryName;
        }
        if (this.div) {
            document.querySelector("#topbar").replaceChild(newDiv, this.div);
        } else {
            document.querySelector("#topbar").appendChild(newDiv);
        }
        this.div = newDiv;
    }
    async getAqi() {
        const { data } = await this.fetchData();
        data.sort((a, b) => b.AQI - a.AQI);
        return data;
    }
    async fetchData() {
        const cache = window.localStorage.getItem("aqi");
        if (cache) {
            const cacheData = JSON.parse(cache);
            if (
                new Date() < new Date(cacheData.date) &&
                this.zip == cacheData.zip
            ) {
                return cacheData;
            }
        }

        const url = new URL("https://wireguard.dalingk.com/weather/aqi/");
        url.searchParams.set("zip", this.zip);
        const response = await fetch(url);
        if (!response.ok) {
            throw "Failed to reach AQI API";
        }
        const data = await response.json();
        window.localStorage.setItem("aqi", JSON.stringify(data));
        return data;
    }
}

fetch("links.json")
    .then((data) => data.json())
    .then((data) => {
        new LinkDisplay(data);
    });

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("worker.js");
    });
}

new AqiWidget().display();
new WeatherApi().display();
