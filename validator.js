//Include all the n3 libraries Ruben Verborgh made
var N3 = require('./node_modules/n3/n3');
require('./node_modules/n3/n3').Util(global);

//This line makes sure that the validate function can be used in different js file
if(window) window.validate = validate;

//variable that can store all the triplets of the rdf file
var store;

//variable that can access the functionality to check if a variable is a literal or a URI
var N3Util;

//create an array with errors and warnings that contain objects with errror messages
var feedback;

//The validation function with a callback to start the code after this function is done
function validate(dcat, callback) {
    store = N3.Store();
    N3Util = N3.Util

    //create an array with errors and warnings that contain objects with errror messages
    feedback = {};
    feedback['errors'] = [];
    feedback['warnings'] = [];  

    //variable that can parse rdf file to URI's
    var parser = N3.Parser();

    parser.parse(dcat, function (error, triple, prefixes) {

        //if there are triples left, store them.
        //if there aren't find the errors and warnings
        if (triple) {
            store.addTriple(triple);
        } else {

            for(className in validatorRules['mandatory']){
                var classes = store.find(null, null, validatorRules['mandatory'][className].URI);

                for(keyClass in classes) {
                    validateClass(className, classes[keyClass].subject);
                }
            }

            //do the callback
            callback();
        }
    });

    return feedback;
}

var validateClass = function(className, URI) {

    var jsonClass = "";

    if(validatorRules["mandatory"][className]) jsonClass = validatorRules["mandatory"][className];
    else jsonClass = validatorRules["optional"][className];

    for(var property in jsonClass.properties) {
        var foundObjects = store.find(URI, jsonClass.properties[property].URI, null);

        if(foundObjects.length >= 1) {

            for(foundObject in foundObjects) {

                //Check literals
                if(jsonClass.properties[property].Range == "Literal") {
                    if(!N3Util.isLiteral(foundObjects[foundObject].object)) {
                        feedback['errors'].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + foundObjects[foundObject].subject + " class: " + jsonClass.class + ", needs to be a Literal"});
                    }

                //Check datetime literals    
                } else if(jsonClass.properties[property].Range == "DateTime") {
                    var date = foundObjects[foundObject].object;
                    var dateRemovedQoutes = date.substring(1, date.length-1);

                    if(!N3Util.isLiteral(foundObjects[foundObject].object) || isNaN(Date.parse(dateRemovedQoutes))) {
                        feedback['errors'].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + foundObjects[foundObject].subject + " class: " + jsonClass.class + ", needs to be a correct ISO 8601 date"});
                    }

                //Check decimal literals
                } else if(jsonClass.properties[property].Range == "Decimal") {
                    if(!N3Util.isLiteral(foundObjects[foundObject].object) || isNaN(foundObjects[foundObject].object)) {
                        feedback['errors'].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + foundObjects[foundObject].subject + " class: " + jsonClass.class + ", needs to be a number"});
                    }

                //Check URI's
                } else {
                    if(!N3Util.isIRI(foundObjects[foundObject].object)) {
                        if(jsonClass.properties[property].Range != "Anything") {
                            feedback['errors'].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + foundObjects[foundObject].subject + " class: " + jsonClass.class + ", needs to be a URI"});
                        }
                    } else {
                        var doesClassExcist = store.find(foundObjects[foundObject].object, null, null);

                        if(doesClassExcist.length > 0) {
                            var newClassName = "";

                            for(key in validatorRules["mandatory"]) {
                                if(doesClassExcist[0].object == validatorRules["mandatory"][key].URI) {
                                    newClassName = key;
                                    break;
                                }
                            }

                            if(newClassName == "") {
                                for(key in validatorRules["optional"]) {
                                    if(doesClassExcist[0].object == validatorRules["optional"][key].URI) {
                                        newClassName = key;
                                        break;
                                    }
                                }
                            }

                            if(newClassName != "" && newClassName != className) {
                                console.log("The class it goes to: " + newClassName + ", the class that it came from: " + className + ", the property that calls the new class: " + jsonClass.properties[property].name);
                                console.log("The URI of the new class: " + foundObjects[foundObject].object);
                                validateClass(newClassName, foundObjects[foundObject].object);
                                /*console.log(jsonClass.properties[property].name + ", of the class: " + jsonClass.class);
                                console.log(doesClassExcist);*/
                            }
                        }
                    }
                }
            }
        } else {
            if(foundObjects.length == 0) {
                
                if(jsonClass.properties[property].required == "mandatory") {
                    feedback['errors'].push({"error":"The property: " + jsonClass.properties[property].name + ", of the class: " + jsonClass.class + " is mandatory"});
                } else if(jsonClass.properties[property].required == "recommended") {
                    feedback['warnings'].push({"error":"The property: " + jsonClass.properties[property].name + ", of the class: " + jsonClass.class + " is recommended"});
                }
            }
        }
    }
};

//the hard-coded validation rules of DCAT
var validatorRules = new Array();
validatorRules['mandatory'] =
{
    "Catalog": {
        "class": "Catalog",
        "required": "mandatory",
        "mutiple": false,
        "URI": "http://www.w3.org/ns/dcat#Catalog",
        "properties": [ 
            {
                "name": "type",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Resource",
                "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            },
            {
                "name": "title",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/title"
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description"
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued"
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified"
            },
            {
                "name": "language",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/language"
            },
            {
                "name": "publisher",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "http://xmlns.com/foaf/0.1/Agent",
                "URI": "http://purl.org/dc/terms/publisher"
            },
            {
                "name": "themes",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
                "URI": "http://purl.org/dc/terms/themeTaxonomy"
            },
            {
                "name": "license",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/license"
            },
            {
                "name": "rigths",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/rights"
            },
            {
                "name": "spatial",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/spatial"
            },
            {
                "name": "dataset",
                "prefix": "dcat",
                "required": "mandatory",
                "Range": "http://www.w3.org/ns/dcat#Dataset",
                "URI": "http://www.w3.org/ns/dcat#dataset"
            },
            {
                "name": "record",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#record"
            },
            {
                "name": "homepage",
                "prefix": "foaf",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://xmlns.com/foaf/0.1/homepage"
            }
        ]
    },
    "Agent": {
        "class": "Agent",
        "required": "mandatory",
        "mutiple": true,
        "URI": "http://xmlns.com/foaf/0.1/Agent",
        "properties": [
            {
                "name": "name",
                "prefix": "foaf",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://xmlns.com/foaf/0.1/name"
            },
            {
                "name": "type",
                "prefix": "dct",
                "required": "recommended",
                "Range": "skos:Concept",
                "URI": "http://www.w3.org/2004/02/skos/core#type"
            }
        ]
    },
    "Dataset": {
        "class": "Dataset",
        "required": "mandatory",
        "mutiple": true,
        "URI": "http://www.w3.org/ns/dcat#Dataset",
        "properties": [
            {
                "name": "type",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "http://www.w3.org/2004/02/skos/core#Concept",
                "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            },
            {
                "name": "title",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/title"
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description"
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued"
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified"
            },
            {
                "name": "language",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/language"
            },
            {
                "name": "publisher",
                "prefix": "dct",
                "required": "recommended",
                "Range": "http://xmlns.com/foaf/0.1/Agent",
                "URI": "http://purl.org/dc/terms/publisher"
            },
            {
                "name": "accrualPeriodicity",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/publisher"
            },
            {
                "name": "identifier",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/identifier"
            },
            {
                "name": "temporal",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/temporal"
            },
            {
                "name": "theme",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "http://www.w3.org/2004/02/skos/core#Concept",
                "URI": "http://www.w3.org/ns/dcat#theme"
            },
            {
                "name": "relation",
                "prefix": "dct",
                "required": "optional",
                "Range": "Resource",
                "URI": "http://purl.org/dc/terms/relation"
            },
            {
                "name": "keyword",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "Literal",
                "URI": "http://www.w3.org/ns/dcat#keyword"
            },
            {
                "name": "contactPoint",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#contactPoint"
            },
            {
                "name": "temporal",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/temporal"
            },
            {
                "name": "spatial",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/spatial"
            },
            {
                "name": "sample",
                "prefix": "adms",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/adms#sample"
            },
            {
                "name": "distribution",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#distribution"
            },
            {
                "name": "landingPage",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#landingPage"
            }
        ]
    }
};

validatorRules['optional'] =
{
    "Distribution": {
        "class": "Distribution",
        "required": "recommended",
        "mutiple": true,
        "URI": "http://www.w3.org/ns/dcat#Distribution",
        "properties": [
            {
                "name": "title",
                "prefix": "dct",
                "required": "optional",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/title"
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description"
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "optional",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued"
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "optional",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified"
            },
            {
                "name": "language",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/language"
            },
            {
                "name": "license",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/license"
            },
            {
                "name": "rigths",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/rights"
            },
            {
                "name": "accessURL",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Resource",
                "URI": "http://www.w3.org/ns/dcat#accessURL"
            },
            {
                "name": "downloadURL",
                "prefix": "dcat",
                "required": "mandatory",
                "Range": "Resource",
                "URI": "http://www.w3.org/ns/dcat#downloadURL"
            },
            {
                "name": "mediaType",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#mediaType"
            },
            {
                "name": "format",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/format"
            },
            {
                "name": "byteSize",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Decimal",
                "URI": "http://www.w3.org/ns/dcat#byteSize"
            }
        ]
    },
    "Concept": {
        "class": "Concept",
        "required": "mandatory",
        "mutiple": true,
        "URI": "http://www.w3.org/2004/02/skos/core#Concept",
        "properties": [
            {
                "name": "prefLabel",
                "prefix": "skos",
                "required": "mandatory",
                "Range": "Literal"
            }
        ]
    },
    "ConceptScheme": {
        "class": "ConceptScheme",
        "required": "mandatory",
        "mutiple": false,
        "URI": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
        "properties": [
            {
                "name": "title",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal"
            }
        ]
    },
    "CatalogRecord": {
        "class": "CatalogRecord",
        "required": "optional",
        "mutiple": false,
        "URI": "http://www.w3.org/ns/dcat#CatalogRecord",
        "properties": [
            {
                "name": "title",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/title"
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description"
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued"
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified"
            },
            {
                "name": "primaryTopic",
                "prefix": "foaf",
                "required": "mandatory",
                "Range": "http://www.w3.org/ns/dcat#Dataset",
                "URI": "http://xmlns.com/foaf/0.1/primaryTopic"
            },
        ]
    },
    "LinguisticSystem": {
        "class": "LinguisticSystem",
        "required": "optional",
        "mutiple": true,
        "URI": "http://purl.org/dc/terms/LinguisticSystem",
        "properties": [

        ]
    },
    "LicenseDocument": {
        "class": "LicenseDocument",
        "required": "recommended",
        "mutiple": true,
        "URI": "http://purl.org/dc/terms/LicenseDocument",
        "properties": [

        ]
    },
    "Frequency": {
        "class": "Frequency",
        "required": "optional",
        "mutiple": true,
        "URI": "http://purl.org/dc/terms/Frequency",
        "properties": [

        ]
    }
};

//DCAT Catalog class
//Three types of literals: literal, DateTime and Decimal
//Rest is a URI
/*validatorRules['Catalog'] =
{
    "class": "Catalog",
    "prefix": "dcat",
    "required": "mandatory",
    "mutiple": false,
    "URI": "http://www.w3.org/ns/dcat#Catalog",
    "properties": [ 
        {
            "name": "type",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "recommended",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "recommended",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/modified"
        },
        {
            "name": "language",
            "prefix": "dct",
            "required": "recommended",
            "Range": "dct:LinguisticSystem",
            "URI": "http://purl.org/dc/terms/language"
        },
        {
            "name": "publisher",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "foaf:Agent",
            "URI": "http://purl.org/dc/terms/publisher"
        },
        {
            "name": "themes",
            "prefix": "dcat",
            "required": "recommended",
            "Range": "skos:ConceptScheme",
            "URI": "http://purl.org/dc/terms/themeTaxonomy"
        },
        {
            "name": "license",
            "prefix": "dct",
            "required": "recommended",
            "Range": "dct:LicenseDocument",
            "URI": "http://purl.org/dc/terms/license"
        },
        {
            "name": "rigths",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:RightsStatement",
            "URI": "http://purl.org/dc/terms/rights"
        },
        {
            "name": "spatial",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:Location",
            "URI": "http://purl.org/dc/terms/spatial"
        },
        {
            "name": "dataset",
            "prefix": "dcat",
            "required": "mandatory",
            "Range": "dcat:Dataset",
            "URI": "http://www.w3.org/ns/dcat#dataset"
        },
        {
            "name": "record",
            "prefix": "dcat",
            "required": "optional",
            "Range": "dcat:CatalogRecord",
            "URI": "http://www.w3.org/ns/dcat#record"
        },
        {
            "name": "homepage",
            "prefix": "foaf",
            "required": "recommended",
            "Range": "foaf:Document",
            "URI": "http://xmlns.com/foaf/0.1/homepage"
        }
    ]
};

//DCAT CatalogRecord class
validatorRules['CatalogRecord'] =
{
    "class": "CatalogRecord",
    "prefix": "dcat",
    "required": "optional",
    "mutiple": false,
    "URI": "http://www.w3.org/ns/dcat#CatalogRecord",
    "properties": [
        {
            "name": "type",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "recommended",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "recommended",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/modified"
        },
        {
            "name": "primaryTopic",
            "prefix": "foaf",
            "required": "mandatory",
            "Range": "foaf:primaryTopic",
            "URI": "http://xmlns.com/foaf/0.1/primaryTopic"
        },
    ]
};

//DCAT Dataset class
validatorRules['Dataset'] =
{
    "class": "Dataset",
    "prefix": "dcat",
    "required": "mandatory",
    "mutiple": true,
    "URI": "http://www.w3.org/ns/dcat#Dataset",
    "properties": [
        {
            "name": "type",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "recommended",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "recommended",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/modified"
        },
        {
            "name": "language",
            "prefix": "dct",
            "required": "recommended",
            "Range": "dct:LinguisticSystem",
            "URI": "http://purl.org/dc/terms/language"
        },
        {
            "name": "publisher",
            "prefix": "dct",
            "required": "recommended",
            "Range": "foaf:Agent",
            "URI": "http://purl.org/dc/terms/publisher"
        },
        {
            "name": "accrualPeriodicity",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:Frequency",
            "URI": "http://purl.org/dc/terms/publisher"
        },
        {
            "name": "identifier",
            "prefix": "dct",
            "required": "optional",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/identifier"
        },
        {
            "name": "temporal",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:PeriodOfTime",
            "URI": "http://purl.org/dc/terms/temporal"
        },
        {
            "name": "theme",
            "prefix": "dcat",
            "required": "recommended",
            "Range": "skos:Concept",
            "URI": "http://www.w3.org/ns/dcat#theme"
        },
        {
            "name": "keyword",
            "prefix": "dcat",
            "required": "recommended",
            "Range": "Literal",
            "URI": "http://www.w3.org/ns/dcat#keyword"
        },
        {
            "name": "contactPoint",
            "prefix": "dcat",
            "required": "recommended",
            "Range": "vcard:Kind",
            "URI": "http://www.w3.org/ns/dcat#contactPoint"
        },
        {
            "name": "temporal",
            "prefix": "dct",
            "required": "optional",
            "Range": "false",
            "URI": "http://purl.org/dc/terms/temporal"
        },
        {
            "name": "spatial",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:Location",
            "URI": "http://purl.org/dc/terms/spatial"
        },
        {
            "name": "distribution",
            "prefix": "dcat",
            "required": "recommended",
            "Range": "dcat:Distribution",
            "URI": "http://www.w3.org/ns/dcat#distribution"
        },
        {
            "name": "landingPage",
            "prefix": "dcat",
            "required": "optional",
            "Range": "foaf:Document",
            "URI": "http://www.w3.org/ns/dcat#landingPage"
        }
    ]
};

//DCAT Distribution class
validatorRules['Distribution'] =
{
    "class": "Distribution",
    "prefix": "dcat",
    "required": "recommended",
    "mutiple": true,
    "URI": "http://www.w3.org/ns/dcat#Distribution",
    "properties": [
        {
            "name": "type",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "optional",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "recommended",
            "Range": "Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "optional",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "optional",
            "Range": "DateTime",
            "URI": "http://purl.org/dc/terms/modified"
        },
        {
            "name": "language",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:LinguisticSystem",
            "URI": "http://purl.org/dc/terms/language"
        },
        {
            "name": "license",
            "prefix": "dct",
            "required": "recommended",
            "Range": "dct:LicenseDocument",
            "URI": "http://purl.org/dc/terms/license"
        },
        {
            "name": "rigths",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:RightsStatement",
            "URI": "http://purl.org/dc/terms/rights"
        },
        {
            "name": "spatial",
            "prefix": "dct",
            "required": "optional",
            "Range": "dct:Location",
            "URI": "http://purl.org/dc/terms/spatial"
        },
        {
            "name": "accessURL",
            "prefix": "dcat",
            "required": "optional",
            "Range": "Resource",
            "URI": "http://www.w3.org/ns/dcat#accessURL"
        },
        {
            "name": "downloadURL",
            "prefix": "dcat",
            "required": "mandatory",
            "Range": "Resource",
            "URI": "http://www.w3.org/ns/dcat#downloadURL"
        },
        //MediaType can either be a literal or a URI
        {
            "name": "mediaType",
            "prefix": "dcat",
            "required": "optional",
            "Range": "dct:MediaTypeOrExtent",
            "URI": "http://www.w3.org/ns/dcat#mediaType"
        },
        {
            "name": "format",
            "prefix": "dct",
            "required": "recommended",
            "Range": "dct:MediaTypeOrExtent",
            "URI": "http://purl.org/dc/terms/format"
        },
        {
            "name": "byteSize",
            "prefix": "dcat",
            "required": "optional",
            "Range": "Decimal",
            "URI": "http://www.w3.org/ns/dcat#byteSize"
        }
    ]
};

//DCAT ConceptScheme class
validatorRules['ConceptScheme'] =
{
    "class": "ConceptScheme",
    "prefix": "skos",
    "required": "mandatory",
    "mutiple": false,
    "URI": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
    "properties": [
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "dct:title"
        }
    ]
};

//DCAT Concept class
validatorRules['Concept'] =
{
    "class": "Concept",
    "prefix": "skos",
    "required": "mandatory",
    "mutiple": true,
    "URI": "http://www.w3.org/2004/02/skos/core#Concept",
    "properties": [
        {
            "name": "prefLabel",
            "prefix": "skos",
            "required": "mandatory",
            "Range": "skos:prefLabel"
        }
    ]
};

//DCAT Agent class
validatorRules['Agent'] =
{
    "class": "Agent",
    "prefix": "foaf",
    "required": "mandatory",
    "mutiple": true,
    "URI": "http://xmlns.com/foaf/0.1/Agent",
    "properties": [
        {
            "name": "name",
            "prefix": "foaf",
            "required": "mandatory",
            "Range": "foaf:name"
        }
    ]
};*/