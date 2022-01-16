import JSON5 from 'json5';
import fs from 'fs'
import yaml from 'js-yaml'
//Old config.yml to new config.json5

const inputfile = "config.yml",
    outputfile = "./config/config.json5",
    obj = yaml.load(fs.readFileSync(inputfile, { encoding: "utf-8" }))

fs.writeFileSync(outputfile, JSON5.stringify(obj, null, 4))
