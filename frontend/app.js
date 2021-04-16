async function onSelectChange () {
    el = document.getElementById("temp-table-list-select");
    elIndex = el.options[el.selectedIndex].getAttribute("oid");

    // Retrieving foreign key schema for the selected table
    const rawResponse = await fetch("http://localhost:3000/temp-db-table-foreign-keys", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "oid": elIndex
        }),
        
    })

    const content = await rawResponse.json();

    console.log(content);
}