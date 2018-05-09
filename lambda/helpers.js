exports.stripArns = (data) => {    
    var clean = [];
    Object.keys(data).forEach(function (key) {
        item = data[key].split("/");
        clean.push(item[1]);
    });
    return clean;
}