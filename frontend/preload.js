const http = require("http");

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    const populateSelectOptions = (selector, list) => {
        var htmlElem = document.getElementById(selector);
        list.forEach(listEl => {
            listOption = document.createElement("option");
            listOption.setAttribute("oid", listEl["oid"])
            listOption.text = listEl["relname"];
            if (htmlElem) htmlElem.add(listOption);
        });
    }

    fetch('http://localhost:3000/temp-db-table-list')
        .then(res => res.json())
        .then(data => populateSelectOptions("table-list-select-dropdown", data));
});