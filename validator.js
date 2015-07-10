//Include all the n3 libraries Ruben Verborgh made
var N3 = require('./node_modules/n3/lib/n3');
require('./node_modules/n3/lib/n3').Util(global);

//This line makes sure that the validate function can be used in different js file
if(window) window.validate = validate;

//The validation function with a callback to start the code after this function is done
function validate(dcat, callback) {
    
    //create an array with errors and warnings that contain objects with errror messages
	var feedback = {};
	feedback['errors'] = [];
	feedback['warnings'] = [];  

	//variable that can parse rdf file to URI's
	var parser = N3.Parser();

	//variable that can store all the triplets of the rdf file
	var store = N3.Store();

	parser.parse(dcat, function (error, triple, prefixes) {

		//if there are triples left, store them.
		//if there aren't find the errors and warnings
		if (triple) {
			store.addTriple(triple);
		} else {

			//Check Dataset class
			var datasets = store.find(null, null , "http://www.w3.org/ns/dcat#Dataset");
		
			if(datasets.length == 0) feedback['errors'].push({"error":"The class Dataset is mandatory"});

			for (key in datasets) {
				var properties = store.find(datasets[key].subject, null, null);

				for(propKey in properties) {
					for(propRulesKey in validatorRules['Dataset'].properties) {
						if(properties[propKey].predicate == validatorRules['Dataset'].properties[propRulesKey].URI) {
							//Check if correct object
							break;
						}
					}
				}
			}

			//Check Distrubution class
			var distributions = store.find(null, null , "http://www.w3.org/ns/dcat#Distribution");

			if(distributions.length == 0) feedback['warnings'].push({"error":"The class Distribution is recommended"});

			for (key in distributions) {
				var properties = store.find(distributions[key].subject, null, null);
				
				for(propKey in properties) {
					for(propRulesKey in validatorRules['Distribution'].properties) {
						if(properties[propKey].predicate == validatorRules['Distribution'].properties[propRulesKey].URI) {
							//Check if correct object
							break;
						}
					}
				}
			}

			//Check Catalog class
			var catalogs = store.find(null, null , "http://www.w3.org/ns/dcat#Catalog");

			if(catalogs.length > 1) {
				feedback['errors'].push({"error":"Multiple Catalog classes are initialized"});
			} else {
				if(catalogs.length == 1) {
					var properties = store.find(catalogs[0].subject, null, null);
				
					for(propKey in properties) {
						for(propRulesKey in validatorRules['Catalog'].properties) {
							if(properties[propKey].predicate == validatorRules['Catalog'].properties[propRulesKey].URI) {
								//Check if correct object
								break;
							}
						}
					}
				} else {
					feedback['errors'].push({"error":"The class Catalog is mandatory"});
				}
			}

			//Check CatalogRecord class
			var catalogRecords = store.find(null, null , "http://www.w3.org/ns/dcat#CatalogRecord");

			if(catalogRecords.length > 1) {
				feedback['errors'].push({"error":"Multiple CatalogRecord classes are initialized"});
			} else {
				if(catalogRecords.length == 1) {
					var properties = store.find(catalogRecords[0].subject, null, null);
				
					for(propKey in properties) {
						for(propRulesKey in validatorRules['Catalog'].properties) {
							if(properties[propKey].predicate == validatorRules['Catalog'].properties[propRulesKey].URI) {
								//Check if correct object
								break;
							}
						}
					}
				}
			}

			//Check ConceptScheme class
			var conceptSchemes = store.find(null, null , "http://www.w3.org/2004/02/skos/core#ConceptScheme");

            if(conceptSchemes.length > 1) {
                feedback['errors'].push({"error":"Multiple ConceptScheme classes are initialized"});
            } else {
                if(conceptSchemes.length == 1) {
                    var properties = store.find(conceptSchemes[0].subject, null, null);
                
                    for(propKey in properties) {
                        for(propRulesKey in validatorRules['ConceptScheme'].properties) {
                            if(properties[propKey].predicate == validatorRules['ConceptScheme'].properties[propRulesKey].URI) {
                                //Check if correct object
                                break;
                            }
                        }
                    }
                } else {
                    feedback['errors'].push({"error":"The class ConceptScheme is mandatory"});
                }
            }

			//Check Concept class
			var concepts = store.find(null, null , "http://www.w3.org/2004/02/skos/core#Concept");

            if(conceptSchemes.length > 1) {
                feedback['errors'].push({"error":"Multiple Concept classes are initialized"});
            } else {
                if(concepts.length == 1) {
                    var properties = store.find(concepts[0].subject, null, null);
                
                    for(propKey in properties) {
                        for(propRulesKey in validatorRules['Concept'].properties) {
                            if(properties[propKey].predicate == validatorRules['Concept'].properties[propRulesKey].URI) {
                                //Check if correct object
                                break;
                            }
                        }
                    }
                } else {
                    feedback['errors'].push({"error":"The class ConceptScheme is mandatory"});
                }
            }

			//Check Agent class
			var agents = store.find(null, null , "http://xmlns.com/foaf/0.1/Agent");

            if(agents.length > 1) {
                feedback['errors'].push({"error":"Multiple Agents classes are initialized"});
            } else {
                if(agents.length == 1) {
                    var properties = store.find(agents[0].subject, null, null);
                
                    for(propKey in properties) {
                        for(propRulesKey in validatorRules['Agent'].properties) {
                            if(properties[propKey].predicate == validatorRules['Agent'].properties[propRulesKey].URI) {
                                //Check if correct object
                                break;
                            }
                        }
                    }
                } else {
                    feedback['errors'].push({"error":"The class Agent is mandatory"});
                }
            }

			//do the callback
      		callback();
		}
	});

	return feedback;
}

//the hard-coded validation rules of DCAT
var validatorRules = new Array();

//DCAT Catalog class
validatorRules['Catalog'] =
{
	"class": "Catalog",
	"prefix": "dcat",
	"required": "mandatory",
	"URI": "http://www.w3.org/ns/dcat#Catalog",
	"properties": [	
		{
      		"name": "type",
      		"prefix": "dct",
      		"required": "mandatory",
      		"Range": "rdfs:Literal",
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
  	"properties": [
	    {
    		"name": "type",
    		"prefix": "dct",
    		"required": "mandatory",
    		"Range": "rdfs:Literal",
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
    "properties": [
        {
        	"name": "type",
        	"prefix": "dct",
        	"required": "mandatory",
        	"Range": "rdfs:Literal",
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
            "Range": "frdfs:Literal",
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
    "properties": [
        {
  	    	"name": "type",
  	    	"prefix": "dct",
  	    	"required": "mandatory",
  	    	"Range": "rdfs:Literal",
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
        {
            "name": "mediaType",
            "prefix": "dcat",
            "required": "recommended",
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
    "properties": [
        {
            "name": "name",
            "prefix": "foaf",
            "required": "mandatory",
            "Range": "foaf:name"
        }
    ]
};