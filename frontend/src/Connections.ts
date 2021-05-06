export const getAllTableMetadata = () => {
    // TODO/Work under progress: new backend hook
    return fetch('http://localhost:3000/tables')
        .then(rawResponse => rawResponse.json())
        .then(res => {
            return res;
        });
}

// Loads schema files
export async function readVisSchemaJSON() {
    return fetch("./src/vis-encodings/simple-entity.json").then(res => {
        return res.json();
    }).then(res => {
        return res["schema"];
    });
}

export async function getTableDistCounts(tableName:string, columnNames?:string[]) {
    const rawResponse = fetch("http://localhost:3000/table-dist-counts", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "tableName": tableName,
            "columnNames": columnNames === undefined ? [] : columnNames
        }),  
    });

    return rawResponse.then(val => {
        return val.json();
    });
}

async function getAttributeContentFromDatabase(tableIndex) {
    const rawResponse = fetch("http://localhost:3000/table-attributes", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "oid": tableIndex
        }),
        
    });

    return rawResponse.then(val => {
        return val.json();
    });
}