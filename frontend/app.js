let onSelectChange = () => {
    el = document.getElementById("temp-table-list-select");
    elIndex = el.options[el.selectedIndex].getAttribute("oid");
}