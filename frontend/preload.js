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

    let populateTableListRequestOptions = {
        host: "localhost",
        port: "3000",
        path: "/temp-db-table-list",
        method: "GET",
    }

    let getTableSchemaRequestOptions = {
        host: "localhost",
        port: "3000",
        path: "/temp-db-schema",
        method: "GET",
    }
    
    http.get(populateTableListRequestOptions, (res) => {
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
            populateSelectOptions("temp-table-list-select", JSON.parse(chunk));
        });
    })

    // http.get(getTableSchemaRequestOptions, (res) => {
    //     res.setEncoding("utf8");
    //     res.on("data", (chunk) => {
    //         console.log(JSON.parse(chunk));
    //     });
    // })
});