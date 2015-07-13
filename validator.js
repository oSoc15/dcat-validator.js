//Include all the n3 libraries Ruben Verborgh made
var N3 = require('./node_modules/n3/n3');
require('./node_modules/n3/n3').Util(global);

//This line makes sure that the validate function can be used in different js file
if(window) window.validate = validate;

//variable that can store all the triplets of the rdf file
var store;

//variable that can access the functionality to check if a variable is a literal or a URI
var N3Util;

//The validation function with a callback to start the code after this function is done
function validate(dcat, callback) {
    store = N3.Store();
    N3Util = N3.Util

    //create an array with errors and warnings that contain objects with errror messages
    var feedback = {};
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

            for(key in validatorRules){
                validateClass(validatorRules[key].class, validatorRules[key].URI, feedback);
            }

            //do the callback
            callback();
        }
    });

    return feedback;
}

var validateClass = function(className, URI, feedback) {

    //find the class in the store
    var classInfo = store.find(null, null , URI);

    //Check if the class is found in the store
    if(classInfo.length >= 1) {

        //If there are mutiple classes initialize check if this is permitted
        if(classInfo.length > 1) {
            if(!validatorRules[className].mutiple) feedback['errors'].push({"error":"Multiple " + className + "s are initialized"});
        }
      
        /*for(propKey in properties) {
            for(propRulesKey in validatorRules[className].properties) {
                if(properties[propKey].predicate == validatorRules[className].properties[propRulesKey].URI) {

                    //Check literals
                    if(validatorRules[className].properties[propRulesKey].Range == "rdfs:Literal") {
                        if(!N3Util.isLiteral(properties[propKey].object)) {
                            feedback['errors'].push({"error":"The object: " + properties[propKey].object + ", of the property: " + validatorRules[className].properties[propRulesKey].name + ", in the " + className + " class: " + classInfo[key].subject + ", needs to be a rdfs:Literal"});
                        }

                    //Check datetime literals    
                    } else if(validatorRules[className].properties[propRulesKey].Range == "rdfs:LiteralDateTime") {
                        var date = properties[propKey].object;
                        var dateRemovedQoutes = date.substring(1, date.length-1);

                        if(!N3Util.isLiteral(properties[propKey].object) || isNaN(Date.parse(dateRemovedQoutes))) {
                            feedback['errors'].push({"error":"The object: " + properties[propKey].object + ", of the property: " + validatorRules[className].properties[propRulesKey].name + ", in the " + className + " class: " + classInfo[key].subject + ", needs to be a correct ISO 8601 date"});
                        }

                    //Check decimal literals
                    } else if(validatorRules[className].properties[propRulesKey].Range == "rdfs:LiteralDecimal") {
                        if(!N3Util.isLiteral(properties[propKey].object) || isNaN(properties[propKey].object)) {
                            feedback['errors'].push({"error":"The object: " + properties[propKey].object + ", of the property: " + validatorRules[className].properties[propRulesKey].name + ", in the " + className + " class: " + classInfo[key].subject + ", needs to be a number"});
                        }

                    //Check URI's
                    } else {
                        if(!N3Util.isIRI(properties[propKey].object)) {
                            feedback['errors'].push({"error":"The object: " + properties[propKey].object + ", of the property: " + validatorRules[className].properties[propRulesKey].name + ", in the " + className + " class: " + classInfo[key].subject + ", needs to be a URI"});
                        }
                    }

                    break;
                }
            }
        }*/

        for(classObject in classInfo) {
            console.log(validatorRules[className].properties);
            for(property in validatorRules[className].properties) {
                var foundProperty = store.find(classInfo[classObject].subject, validatorRules[className].properties[property].URI, null);

                if(foundProperty.length == 1) {
                    foundProperty = foundProperty[0];

                    //Check literals
                    if(validatorRules[className].properties[property].Range == "rdfs:Literal") {
                        if(!N3Util.isLiteral(foundProperty.object)) {
                            feedback['errors'].push({"error":"The object: " + foundProperty.object + ", of the property: " + validatorRules[className].properties[property].name + ", in the " + foundProperty.subject + " class: " + validatorRules[className].class + ", needs to be a rdfs:Literal"});
                        }

                    //Check datetime literals    
                    } else if(validatorRules[className].properties[property].Range == "rdfs:LiteralDateTime") {
                        var date = foundProperty.object;
                        var dateRemovedQoutes = date.substring(1, date.length-1);

                        if(!N3Util.isLiteral(foundProperty.object) || isNaN(Date.parse(dateRemovedQoutes))) {
                            feedback['errors'].push({"error":"The object: " + foundProperty.object + ", of the property: " + validatorRules[className].properties[property].name + ", in the " + foundProperty.subject + " class: " + validatorRules[className].class + ", needs to be a correct ISO 8601 date"});
                        }

                    //Check decimal literals
                    } else if(validatorRules[className].properties[property].Range == "rdfs:LiteralDecimal") {
                        if(!N3Util.isLiteral(foundProperty.object) || isNaN(foundProperty.object)) {
                            feedback['errors'].push({"error":"The object: " + foundProperty.object + ", of the property: " + validatorRules[className].properties[property].name + ", in the " + foundProperty.subject + " class: " + validatorRules[className].class + ", needs to be a number"});
                        }

                    //Check URI's
                    } else {
                        if(!N3Util.isIRI(foundProperty.object)) {
                            feedback['errors'].push({"error":"The object: " + foundProperty.object + ", of the property: " + validatorRules[className].properties[property].name + ", in the " + foundProperty.subject + " class: " + validatorRules[className].class + ", needs to be a URI"});
                        }
                    }
                }
            }
        }
    } else {

        //If the class is mandatory add an error
        if(validatorRules[className].required == "mandatory") feedback['errors'].push({"error":"The class " + className + " is mandatory"});

        //If the class is required add a warning
        else if(validatorRules[className].required == "recommended") feedback['warnings'].push({"error":"The class " + className + " is recommended"});
    }
};

//the hard-coded validation rules of DCAT
var validatorRules = new Array();

//DCAT Catalog class
//Three types of literals: literal, literalDatetime and literalDecimal
//Rest is a URI
validatorRules['Catalog'] =
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
            "Range": "rdfs:Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
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
            "Range": "rdfs:Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
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
            "Range": "rdfs:Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
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
            "Range": "rdfs:Literal",
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
            "Range": "rdfs:Literal",
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
            "Range": "rdfs:Resource",
            "URI": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        },
        {
            "name": "title",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/title"
        },
        {
            "name": "description",
            "prefix": "dct",
            "required": "mandatory",
            "Range": "rdfs:Literal",
            "URI": "http://purl.org/dc/terms/description"
        },
        {
            "name": "issued",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
            "URI": "http://purl.org/dc/terms/issued"
        },
        {
            "name": "modified",
            "prefix": "dct",
            "required": "recommended",
            "Range": "rdfs:LiteralDateTime",
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
            "required": "mandatory",
            "Range": "rdfs:Resource",
            "URI": "http://www.w3.org/ns/dcat#accessURL"
        },
        {
            "name": "downloadURL",
            "prefix": "dcat",
            "required": "optional",
            "Range": "rdfs:Resource",
            "URI": "http://www.w3.org/ns/dcat#downloadURL"
        },
        //MediaType can either be a literal or a URI
        /*{
            "name": "mediaType",
            "prefix": "dcat",
            "required": "recommended",
            "Range": "dct:MediaTypeOrExtent",
            "URI": "http://www.w3.org/ns/dcat#mediaType"
        },*/
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
            "Range": "rdfs:LiteralDecimal",
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
};