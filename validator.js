//Include all the n3 libraries Ruben Verborgh made
var N3 = require('./node_modules/n3/n3');
require('./node_modules/n3/n3').Util(global);

//This line makes sure that the validate function can be used in different js file
if(typeof window !== 'undefined') window.validate = validate;

//variable that can store all the triplets of the rdf file
var store;

//variable that can access the functionality to check if a variable is a literal or a URI
var N3Util;

//create an array with errors and warnings that contain objects with errror messages
var feedback;

//An array of URI's to check if a certain class isn't already checked
var checkedClasses = [];

//The validation function with a callback to start the code after this function is done
function validate(dcat, callback) {

    //Initialize store and N3Util
    store = N3.Store();
    N3Util = N3.Util;

    //create an array with errors and warnings that contain objects with errror messages
    feedback = {};
    feedback['errors'] = [];
    feedback['warnings'] = [];

    var parser = N3.Parser();
    parser.parse(dcat, function (error, triple, prefixes) {

        //if there are triples left, store them.
        //if there aren't find the errors and warnings
        if (triple) {
            store.addTriple(triple);
        } else {

            //loop through the mandatory classes of the validatorRules
            //Find the URI of these mandatory classes
            //Give the className and the URI to the validateClass method
            for(className in validatorRules['mandatory']){
                var classes = store.find(null, null, validatorRules['mandatory'][className].URI);

                //Check if only one catalog is initialized
                if(classes.length == 1) {
                    for(keyClass in classes) {
                        checkedClasses.push(classes[keyClass].subject);
                        validateClass(className, classes[keyClass].subject);
                    }
                } else if(classes.length == 0) {
                    feedback['errors'].push({"error":"The class: Catalog is mandatory"});
                } else {
                    feedback['errors'].push({"error":"Multiple Catalog classes initialized"});
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

    //Initialize the jsonClass of this class
    if(validatorRules["mandatory"][className]) jsonClass = validatorRules["mandatory"][className];
    else jsonClass = validatorRules["optional"][className];

    //Loop through all properties of this class
    //These are all properties in the w3c scheme of DCAT of a certain class (e.g. Catalog)
    for(var property in jsonClass.properties) {

        //find an object with the current property and the URI given in the function
        var foundObjects = store.find(URI, jsonClass.properties[property].URI, null);

        //If no object is found, check if the property was mandatory or recommended and respectively put an error or warning
        if(foundObjects.length >= 1) {

            //Check if their are multiple objects found and if it is allowed, if not put an error
            if(foundObjects.length > 1 && !jsonClass.properties[property].multiple) {
                if(typeof feedback['errors'][URI] == 'undefined') {
                    feedback['errors'][URI] = [];
                }

                feedback['errors'][URI].push({"error":"Objects: " + foundObjects[0].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + jsonClass.class + " class: " + foundObjects[0].subject + ", can't be initialized more than once"});
            } else {

                //Loop through the found objects and validate them
                for(foundObject in foundObjects) {

                    //Check literals
                    if(jsonClass.properties[property].Range == "Literal") {
                        if(!N3Util.isLiteral(foundObjects[foundObject].object)) {
                            if(typeof feedback['errors'][URI] == 'undefined') {
                                feedback['errors'][URI] = [];
                            }

                            feedback['errors'][URI].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + jsonClass.class + " class: " +  foundObjects[foundObject].subject + ", needs to be a Literal"});
                        }

                    //Check datetime literals    
                    } else if(jsonClass.properties[property].Range == "DateTime") {

                        //get the literal value (in case of n3)
                        var date = N3Util.getLiteralValue(foundObjects[foundObject].object);

                        if(date[0] = "\"") date = date.substring(1, date.length-1);

                        if(!N3Util.isLiteral(foundObjects[foundObject].object) || isNaN(Date.parse(date))) {
                            if(typeof feedback['errors'][URI] == 'undefined') {
                                feedback['errors'][URI] = [];
                            }

                            feedback['errors'][URI].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + jsonClass.class + " class: " + foundObjects[foundObject].subject + ", needs to be a correct ISO 8601 date"});
                        }

                    //Check decimal literals
                    } else if(jsonClass.properties[property].Range == "Decimal") {

                        //get the literal value (in case of n3)
                        var decimal = N3Util.getLiteralValue(foundObjects[foundObject].object);

                        if(!N3Util.isLiteral(foundObjects[foundObject].object) || isNaN(decimal)) {
                            if(typeof feedback['errors'][URI] == 'undefined') {
                                feedback['errors'][URI] = [];
                            }

                            feedback['errors'][URI].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + jsonClass.class + " class: " + foundObjects[foundObject].subject + ", needs to be a number"});
                        }

                    //Check URI's
                    } else {

                        //check if the found object is a URI and if it may be a literal if it doesn't put an error
                        if(!N3Util.isIRI(foundObjects[foundObject].object)) {
                            if(jsonClass.properties[property].Range != "Anything") {
                                if(typeof feedback['errors'][URI] == 'undefined') {
                                    feedback['errors'][URI] = [];
                                }

                                feedback['errors'][URI].push({"error":"The object: " + foundObjects[foundObject].object + ", of the property: " + jsonClass.properties[property].name + ", in the " + jsonClass.class + " class: " + foundObjects[foundObject].subject + ", needs to be a URI"});
                            }
                        } else {

                            //Look if the found object is a subject elsewhere in the file (it should be)
                            var doesClassExcist = store.find(foundObjects[foundObject].object, null, null);

                            //If the object is elsewhere in the file get the name of the new class, else put an error
                            if(doesClassExcist.length > 0) {
                                var newClassName = "";

                                //Find the name of the new class
                                for(key in validatorRules["optional"]) {
                                    if(doesClassExcist[0].object == validatorRules["optional"][key].URI) {
                                        newClassName = key;
                                        break;
                                    }
                                }

                                //If the name of the new class is found, validate the new class
                                if(newClassName != "" && newClassName != className) {

                                    //Check if the new class is already validated
                                    //If it is do nothing
                                    //If it isn't check the new class
                                    if(isClassChecked(foundObjects[foundObject].object)) {
                                        checkedClasses.push(foundObjects[foundObject].object);
                                        validateClass(newClassName, foundObjects[foundObject].object);
                                    }  
                                }
                            } else {

                                //If the range of the property is not "Anything" put error 
                                if(jsonClass.properties[property].name != "type" && jsonClass.properties[property].Range != "Anything") {
                                    if(typeof feedback['errors'][URI] == 'undefined') {
                                        feedback['errors'][URI] = [];
                                    }

                                    feedback['errors'][URI].push({"error":"The class: " + jsonClass.properties[property].Range + ", with URI: " + foundObjects[foundObject].object + " needs to be initialized"});
                                }
                            }
                        }
                    }
                }
            }
        } else {
            if(foundObjects.length == 0) {               
                if(jsonClass.properties[property].required == "mandatory") {
                    if(typeof feedback['errors'][URI] == 'undefined') {
                        feedback['errors'][URI] = [];
                    }

                    feedback['errors'][URI].push({"error":"The property: " + jsonClass.properties[property].name + ", of the " + jsonClass.class + " class: " + URI + " is mandatory"});
                } else if(jsonClass.properties[property].required == "recommended") {
                    if(typeof feedback['warnings'][URI] == 'undefined') {
                        feedback['warnings'][URI] = [];
                    }

                    feedback['warnings'][URI].push({"error":"The property: " + jsonClass.properties[property].name + ", of the " + jsonClass.class + " class: " + URI + " is recommended"});
                }
            }
        }
    }
};

//Method to check if the a certain class is already validated before
var isClassChecked = function(URI) {
    var checked = false;

    //loop over all the uri's of the already validated classes
    for(uriClass in checkedClasses) {
        if(checkedClasses[uriClass] == URI) {
            checked = true;
            break;
        }
    }

    return checked;
}

//the hard-coded validation rules of DCAT
var validatorRules = new Array();

//The class where it all begins: "Catalog" (mandatory)
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
                "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                "multiple": false
            },
            {
                "name": "title",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/title",
                "multiple": false
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description",
                "multiple": false
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued",
                "multiple": false
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified",
                "multiple": false
            },
            {
                "name": "language",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/language",
                "multiple": false
            },
            {
                "name": "publisher",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "http://xmlns.com/foaf/0.1/Agent",
                "URI": "http://purl.org/dc/terms/publisher",
                "multiple": false
            },
            {
                "name": "themes",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
                "URI": "http://purl.org/dc/terms/themeTaxonomy",
                "multiple": false
            },
            {
                "name": "license",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/license",
                "multiple": false
            },
            {
                "name": "rigths",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/rights",
                "multiple": false
            },
            {
                "name": "spatial",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/spatial",
                "multiple": false
            },
            {
                "name": "dataset",
                "prefix": "dcat",
                "required": "mandatory",
                "Range": "http://www.w3.org/ns/dcat#Dataset",
                "URI": "http://www.w3.org/ns/dcat#dataset",
                "multiple": true
            },
            {
                "name": "record",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#record",
                "multiple": false
            },
            {
                "name": "homepage",
                "prefix": "foaf",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://xmlns.com/foaf/0.1/homepage",
                "multiple": false
            }
        ]
    }
};

//The classes that can be in the DCAT feed (optional)
validatorRules['optional'] =
{
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
                "URI": "http://xmlns.com/foaf/0.1/name",
                "multiple": false
            },
            {
                "name": "type",
                "prefix": "dct",
                "required": "recommended",
                "Range": "skos:Concept",
                "URI": "http://www.w3.org/2004/02/skos/core#type",
                "multiple": false
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
                "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                "multiple": false
            },
            {
                "name": "title",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/title",
                "multiple": false
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description",
                "multiple": false
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued",
                "multiple": false
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified",
                "multiple": false
            },
            {
                "name": "language",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/language",
                "multiple": false
            },
            {
                "name": "publisher",
                "prefix": "dct",
                "required": "recommended",
                "Range": "http://xmlns.com/foaf/0.1/Agent",
                "URI": "http://purl.org/dc/terms/publisher",
                "multiple": false
            },
            {
                "name": "accrualPeriodicity",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/publisher",
                "multiple": false
            },
            {
                "name": "identifier",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/identifier",
                "multiple": false
            },
            {
                "name": "temporal",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/temporal",
                "multiple": false
            },
            {
                "name": "theme",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "http://www.w3.org/2004/02/skos/core#Concept",
                "URI": "http://www.w3.org/ns/dcat#theme",
                "multiple": false
            },
            {
                "name": "relation",
                "prefix": "dct",
                "required": "optional",
                "Range": "Resource",
                "URI": "http://purl.org/dc/terms/relation",
                "multiple": false
            },
            {
                "name": "keyword",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "Literal",
                "URI": "http://www.w3.org/ns/dcat#keyword",
                "multiple": true
            },
            {
                "name": "contactPoint",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#contactPoint",
                "multiple": false
            },
            {
                "name": "temporal",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/temporal",
                "multiple": false
            },
            {
                "name": "spatial",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/spatial",
                "multiple": false
            },
            {
                "name": "sample",
                "prefix": "adms",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/adms#sample",
                "multiple": false
            },
            {
                "name": "distribution",
                "prefix": "dcat",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#distribution",
                "multiple": false
            },
            {
                "name": "landingPage",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#landingPage",
                "multiple": false
            }
        ]
    },
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
                "URI": "http://purl.org/dc/terms/title",
                "mutiple": false
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description",
                "mutiple": false
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "optional",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued",
                "mutiple": false
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "optional",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified",
                "mutiple": false
            },
            {
                "name": "language",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/language",
                "mutiple": false
            },
            {
                "name": "license",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/license",
                "mutiple": false
            },
            {
                "name": "rigths",
                "prefix": "dct",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/rights",
                "mutiple": false
            },
            {
                "name": "accessURL",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Resource",
                "URI": "http://www.w3.org/ns/dcat#accessURL",
                "mutiple": false
            },
            {
                "name": "downloadURL",
                "prefix": "dcat",
                "required": "mandatory",
                "Range": "Resource",
                "URI": "http://www.w3.org/ns/dcat#downloadURL",
                "mutiple": false
            },
            {
                "name": "mediaType",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Anything",
                "URI": "http://www.w3.org/ns/dcat#mediaType",
                "mutiple": false
            },
            {
                "name": "format",
                "prefix": "dct",
                "required": "recommended",
                "Range": "Anything",
                "URI": "http://purl.org/dc/terms/format",
                "mutiple": false
            },
            {
                "name": "byteSize",
                "prefix": "dcat",
                "required": "optional",
                "Range": "Decimal",
                "URI": "http://www.w3.org/ns/dcat#byteSize",
                "mutiple": false
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
                "Range": "Literal",
                "URI": "http://www.w3.org/2004/02/skos/core#prefLabel",
                "mutiple": false
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
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/title",
                "mutiple": false
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
                "URI": "http://purl.org/dc/terms/title",
                "mutiple": false
            },
            {
                "name": "description",
                "prefix": "dct",
                "required": "mandatory",
                "Range": "Literal",
                "URI": "http://purl.org/dc/terms/description",
                "mutiple": false
            },
            {
                "name": "issued",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/issued",
                "mutiple": false
            },
            {
                "name": "modified",
                "prefix": "dct",
                "required": "recommended",
                "Range": "DateTime",
                "URI": "http://purl.org/dc/terms/modified",
                "mutiple": false
            },
            {
                "name": "primaryTopic",
                "prefix": "foaf",
                "required": "mandatory",
                "Range": "http://www.w3.org/ns/dcat#Dataset",
                "URI": "http://xmlns.com/foaf/0.1/primaryTopic",
                "mutiple": false
            },
        ]
    },
    "LinguisticSystem": {
        "class": "LinguisticSystem",
        "required": "optional",
        "mutiple": false,
        "URI": "http://purl.org/dc/terms/LinguisticSystem",
        "properties": [

        ]
    },
    "LicenseDocument": {
        "class": "LicenseDocument",
        "required": "recommended",
        "mutiple": false,
        "URI": "http://purl.org/dc/terms/LicenseDocument",
        "properties": [

        ]
    },
    "Frequency": {
        "class": "Frequency",
        "required": "optional",
        "mutiple": false,
        "URI": "http://purl.org/dc/terms/Frequency",
        "properties": [

        ]
    },
    "Document": {
        "class": "Document",
        "required": "optional",
        "mutiple": false,
        "URI": "http://xmlns.com/foaf/0.1/Document",
        "properties": [

        ]
    }
};
