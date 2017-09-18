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
                while (resultIDX + 1 < tempLen && (results[resultIDX] + 1) == results[resultIDX + 1]) {
                    resultIDX++;
                }
                this.results.push({start: results[start], end: results[resultIDX]});
                resultIDX++;
            }
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

        let nameChar = '';
        let termChar = '';
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
        return this.linkItem.element(this.results);
    }
    get url() {
        return this.linkItem.url;
    }
}

class LinkItem {
    constructor(data) {
        this.name = data.name;
        this.url = data.url;
        this.search = new FuzzySearch(data.name);
    }
    element(results) {
        let text = document.createDocumentFragment();
        if (results) {
            let nameIDX = 0;
            for (let i = 0; i < results.length; i++) {
                let { start, end } = results[i];

                text.appendChild(this.textSnip(nameIDX, start));

                let strong = document.createElement('strong');
                strong.appendChild(this.textSnip(start, end + 1));
                text.appendChild(strong);

                nameIDX = end + 1;
            }
            if (nameIDX < this.name.length)
                text.appendChild(this.textSnip(nameIDX, this.name.length));
        } else {
            text.appendChild(document.createTextNode(this.name));
        }

        let elm;
        if (this.url) {
            elm = document.createElement('a');
            elm.href = this.url;
            elm.appendChild(text);
        }
        else {
            elm = text;
        }
        return elm;
    }
    textSnip(start, end) {
        return document.createTextNode(this.name.substring(start, end));
    }
}
class LinkHeader {
    constructor(data) {
        this.content = new LinkItem(data);
    }
    element() {
        let header = document.createElement('header');
        let h1 = document.createElement('h1');
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
        this.links = group.links.map(item => new LinkItem(item));
        this.links.sort((a,b) => {
            let aLower = a.name.toLowerCase();
            let bLower = b.name.toLowerCase();
            if (aLower < bLower)
                return -1;
            else if (aLower == bLower)
                return 0;
            else
                return 1;
        });
    }
    element() {
        let section = document.createElement('section');
        section.appendChild(this.header.element());

        let linkContent = document.createElement('ul');
        this.links.map(link => {
            let li = document.createElement('li');
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
        this.wrapper = document.createElement('section');
        this.wrapper.classList.add('input');

        let form = document.createElement('form');
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (this.results.length > 0 && this.input.value.length > 0) {
                window.location = this.results[0].url;
            }
        });
        this.input = this.createInput();
        form.appendChild(this.input);
        this.wrapper.appendChild(form);

        this.suggestions = document.createElement('div');
        this.suggestions.id = 'suggestions';
        this.wrapper.appendChild(this.suggestions);
        this.searchArray = searchItems.map(item => new FuzzySearch(item));
        this.results = [];

        window.addEventListener('keydown', e => {
            if (e.target != this.input) {
                this.input.focus();
            }
        });
    }
    element() {
        return this.wrapper;
    }
    createInput() {
        let input = document.createElement('input');
        input.type = 'text';
        input.name = 'q';
        input.autocomplete = 'off';
        input.addEventListener('focus', e => e.target.select());
        input.addEventListener('input', e => this.search(this.input.value));
        input.focus();
        return input;
    }
    search(term) {
        if (this.input.value.length > 0) {
            this.results = this.searchArray.filter(item => item.search(term));
            this.results.push(new LinkItem({name: `Search: ${term}`, url: `https://www.google.com/search?q=${term}`}));
            let list = document.createElement('ul');
            this.results.map(item => {
                let li = document.createElement('li');
                li.appendChild(item.element());
                list.appendChild(li);
            });
            let fresh_suggestions = document.createElement('div');
            fresh_suggestions.id = 'suggestions';
            fresh_suggestions.appendChild(list);
            this.wrapper.replaceChild(fresh_suggestions, this.suggestions);
            this.suggestions = fresh_suggestions;
        } else {
            suggestions.style.display = 'none';
        }
    }
}

class LinkDisplay {
    constructor(links) {
        let displayed = links.display.map(group => new LinkGroup(group));
        let hidden = links.hidden.map(hiddenLink => new LinkItem(hiddenLink));
        let allItems = displayed.reduce((acc, group) => acc.concat(group.links), []).concat(hidden);
        this.title = document.createElement('title');
        this.main = document.createElement('main');
        this.search = new LinkSearch(allItems);

        let header = new LinkHeader(links.title);

        this.main.appendChild(this.search.element());
        this.main.appendChild(header.element());

        let linkDiv = document.createElement('div');
        linkDiv.id = 'links';
        displayed.map(group => linkDiv.appendChild(group.element()));
        this.main.appendChild(linkDiv);

        this.title.appendChild(document.createTextNode(header.name));
        document.head.appendChild(this.title);

        document.body.appendChild(this.main);
    }
}

fetch('links.json').then(data => data.json()).then(data => {
    new LinkDisplay(data);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('worker.js').then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

