const JSON5 = require('json5');
//Old config.yml to new config.json5

var inputfile = "config.yml",
    outputfile = "./config/config.json5",
    yaml = require("js-yaml"),
    fs = require("fs"),
    obj = yaml.load(fs.readFileSync(inputfile, { encoding: "utf-8" }))

fs.writeFileSync(outputfile, JSON5.stringify(obj, null, 4))
