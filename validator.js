//Include all the n3 libraries Ruben Verborgh made
var N3 = require('./node_modules/n3/n3');
require('./node_modules/n3/n3').Util(global);

//This line makes sure that the validate function can be used in different js file
if(typeof window !== 'undefined') {
    window.validate = validate;
}

//variable that can store all the triplets of the rdf file
var store;

//variable that can access the functionality to check if a variable is a literal or a URI
var N3Util;

//the validation rules of DCAT (passed in the validate fuction as an argument)
var validatorRules;

//create an array with errors and warnings that contain objects with errror messages
var feedback;

//An array of URI's to check if a certain class isn't already checked
var checkedClasses = [];

//The validation function with a callback to start the code after this function is done
function validate(dcat, rules, callback) {

    //Initialize store, N3Util and validatorRules
    store = N3.Store();
    N3Util = N3.Util;
    validatorRules = rules;

    //create an array with errors and warnings that contain objects with errror messages
    feedback = {};
    feedback['errors'] = {};
    feedback['warnings'] = {};

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
            for(var className in validatorRules['mandatory']){
                var classes = store.find(null, null, validatorRules['mandatory'][className].URI);

                //Check if only one catalog is initialized
                if(classes.length == 1) {
                    for(keyClass in classes) {
                        checkedClasses.push(classes[keyClass].subject);
                        validateClass(className, classes[keyClass].subject);
                    }
                } else if(classes.length === 0) {

                    //Check if the specific array already exists
                    if(feedback['errors']['Catalog '] == undefined) {

                        feedback['errors']['Catalog '] = {
                            'class': 'Catalog',
                            'URIClass': null,
                            'error': []
                        };
                    }

                    //Push all the information about the error into the array
                    feedback['errors']['Catalog '].error.push({
                        'message': 'is mandatory',
                        'property': null,
                        'URIProperty': null,
                        'valueProperty': null
                    });
                } else {

                    //Check if the specific array already exists
                    if(feedback['errors']['Catalog '] == undefined) {
                        feedback['errors']['Catalog '] = {
                            'class': 'Catalog',
                            'URIClass': null,
                            'error': []
                        };
                    }

                    //Push all the information about the error into the array
                    feedback['errors']['Catalog '].error.push({
                        'message': 'mutiple',
                        'property': null,
                        'URIProperty': null,
                        'valueProperty': null
                    });
                }
            }
           
            //do the callback
            callback();
        }
    });

    return feedback;
}

var validateClass = function(className, URI) {

    var jsonClass = '';

    //Initialize the jsonClass of this class
    if(validatorRules['mandatory'][className]) {
        jsonClass = validatorRules['mandatory'][className];
    } else {
        jsonClass = validatorRules['optional'][className];
    }

    //Loop through all properties of this class
    //These are all properties in the w3c scheme of DCAT of a certain class (e.g. Catalog)
    for(var property in jsonClass.properties) {

        //find an object with the current property and the URI given in the function
        var foundObjects = store.find(URI, jsonClass.properties[property].URI, null);

        //If no object is found, check if the property was mandatory or recommended and respectively put an error or warning
        if(foundObjects.length >= 1) {

            //Check if their are multiple objects found and if it is allowed, if not put an error
            if(foundObjects.length > 1 && !jsonClass.properties[property].multiple) {
                
                //Check if the specific array already exists
                if(feedback['errors'][className + ' ' + URI] == undefined) {
                    feedback['errors'][className + ' ' + URI] = {
                        'class': className,
                        'URIClass': URI,
                        'error': []
                    };
                }

                //Push all the information about the error into the array
                feedback['errors'][className + ' ' + URI].error.push({
                    'message': 'can\'t have multiple objects',
                    'property': jsonClass.properties[property].name,
                    'URIProperty': jsonClass.properties[property].URI,
                    'valueProperty': null
                });
            } else {

                //Loop through the found objects and validate them
                for(foundObject in foundObjects) {

                    //Check literals
                    if(jsonClass.properties[property].Range == 'Literal') {
                        if(!N3Util.isLiteral(foundObjects[foundObject].object)) {

                            //Check if the specific array already exists
                            if(feedback['errors'][className + ' ' + URI] == undefined) {
                                feedback['errors'][className + ' ' + URI] = {
                                    'class': className,
                                    'URIClass': URI,
                                    'error': []
                                };
                            }

                            //Push all the information about the error into the array
                            feedback['errors'][className + ' ' + URI].error.push({
                                'message': 'needs to be a Literal',
                                'property': jsonClass.properties[property].name,
                                'URIProperty': jsonClass.properties[property].URI,
                                'valueProperty': foundObjects[foundObject].object
                            });
                        }

                    //Check datetime literals    
                    } else if(jsonClass.properties[property].Range == 'DateTime') {

                        //get the literal value (in case of n3)
                        var date = N3Util.getLiteralValue(foundObjects[foundObject].object);

                        //Safari doensn't support ISO 8601 dates
                        //This is a quick fix for that problem (regex)
                        var regex = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/i;

                        //Check if the date is valid
                        var isDate = regex.test(date);

                        //If the object isn't a literal or the date isn't valid put an error
                        if(!N3Util.isLiteral(foundObjects[foundObject].object) || !isDate) {

                            //Check if the specific array already exists
                            if(feedback['errors'][className + ' ' + URI] == undefined) {
                                feedback['errors'][className + ' ' + URI] = {
                                    'class': className,
                                    'URIClass': URI,
                                    'error': []
                                };
                            }

                            //Push all the information about the error into the array
                            feedback['errors'][className + ' ' + URI].error.push({
                                'message': 'needs to be a correct ISO 8601 date',
                                'property': jsonClass.properties[property].name,
                                'URIProperty': jsonClass.properties[property].URI,
                                'valueProperty': foundObjects[foundObject].object
                            });
                        }

                    //Check decimal literals
                    } else if(jsonClass.properties[property].Range == 'Decimal') {

                        //get the literal value (in case of n3)
                        var decimal = N3Util.getLiteralValue(foundObjects[foundObject].object);

                        if(!N3Util.isLiteral(foundObjects[foundObject].object) || isNaN(decimal)) {

                            //Check if the specific array already exists
                            if(feedback['errors'][className + ' ' + URI] == undefined) {
                                feedback['errors'][className + ' ' + URI] = {
                                    'class': className,
                                    'URIClass': URI,
                                    'error': []
                                };
                            }

                            //Push all the information about the error into the array
                            feedback['errors'][className + ' ' + URI].error.push({
                                'message': 'needs to be a number',
                                'property': jsonClass.properties[property].name,
                                'URIProperty': jsonClass.properties[property].URI,
                                'valueProperty': foundObjects[foundObject].object
                            });
                        }

                    //Check URI's
                    } else {

                        //check if the found object is a URI and if it may be a literal if it doesn't put an error
                        if(!N3Util.isIRI(foundObjects[foundObject].object)) {
                            if(jsonClass.properties[property].Range != 'Anything') {
                            
                                //Check if the specific array already exists
                                if(feedback['errors'][className + ' ' + URI] == undefined) {
                                    feedback['errors'][className + ' ' + URI] = {
                                        'class': className,
                                        'URIClass': URI,
                                        'error': []
                                    };
                                }

                                //Push all the information about the error into the array
                                feedback['errors'][className + ' ' + URI].error.push({
                                    'message': 'needs to be a URI',
                                    'property': jsonClass.properties[property].name,
                                    'URIProperty': jsonClass.properties[property].URI,
                                    'valueProperty': foundObjects[foundObject].object
                                });
                            }
                        } else {

                            //Look if the found object is a subject elsewhere in the file (it should be)
                            var doesClassExcist = store.find(foundObjects[foundObject].object, null, null);

                            //If the object is elsewhere in the file get the name of the new class, else put an error
                            if(doesClassExcist.length > 0) {
                                var newClassName = '';

                                //Find the name of the new class
                                for(key in validatorRules['optional']) {
                                    if(doesClassExcist[0].object == validatorRules['optional'][key].URI) {
                                        newClassName = key;
                                        break;
                                    }
                                }

                                //If the name of the new class is found, validate the new class
                                if(newClassName !== '' && newClassName != className) {

                                    //Check if the new class is already validated
                                    //If it is do nothing
                                    //If it isn't check the new class
                                    if(!isClassChecked(newClassName, foundObjects[foundObject].object)) {
                                        checkedClasses.push(foundObjects[foundObject].object);
                                        validateClass(newClassName, foundObjects[foundObject].object);
                                    }  
                                }
                            } else {

                                //If the range of the property is not 'Anything' put error 
                                if(jsonClass.properties[property].name != 'type' && jsonClass.properties[property].Range != 'Anything') {

                                    var uninitializedClassName = '';

                                    //Check the uninitialized class name
                                    for(var checkClass in validatorRules['optional']) {
                                        if(validatorRules['optional'][checkClass].URI == jsonClass.properties[property].Range) {
                                            uninitializedClassName = validatorRules['optional'][checkClass].class;
                                            break;
                                        }
                                    }

                                    //Check if the uninitializedClassName is found
                                    if(uninitializedClassName != '') {

                                        //Check if the specific array already exists
                                        if(feedback['errors'][uninitializedClassName + ' ' + foundObjects[foundObject].object] == undefined) {
                                            feedback['errors'][uninitializedClassName + ' ' + foundObjects[foundObject].object] = {
                                                'class': uninitializedClassName,
                                                'URIClass': foundObjects[foundObject].object,
                                                'error': []
                                            };
                                        }

                                        //Push all the information about the error into the array
                                        feedback['errors'][uninitializedClassName + ' ' + foundObjects[foundObject].object].error.push({
                                            'message': 'needs to be initialized',
                                            'property': null,
                                            'URIProperty': null,
                                            'valueProperty': null
                                        });
                                    } else {

                                        //Check if the specific array already exists
                                        if(feedback['errors'][jsonClass.properties[property].Range + ' ' + foundObjects[foundObject].object] == undefined) {
                                            feedback['errors'][jsonClass.properties[property].Range + ' ' + foundObjects[foundObject].object] = {
                                                'class': jsonClass.properties[property].Range,
                                                'URIClass': foundObjects[foundObject].object,
                                                'error': []
                                            };
                                        }

                                        //Push all the information about the error into the array
                                        feedback['errors'][jsonClass.properties[property].Range + ' ' + foundObjects[foundObject].object].error.push({
                                                'message': 'needs to be initialized',
                                                'property': null,
                                                'URIProperty': null,
                                                'valueProperty': null
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {

            //If the property is not present in this class
            if(foundObjects.length === 0) {   

                //If the property is mandatory put an error in the array            
                if(jsonClass.properties[property].required == 'mandatory') {

                    //Check if the specific array already exists
                    if(feedback['errors'][className + ' ' + URI] == undefined) {
                        feedback['errors'][className + ' ' + URI] = {
                            'class': className,
                            'URIClass': URI,
                            'error': []
                        };
                    }

                    //Push all the information about the error into the array
                    feedback['errors'][className + ' ' + URI].error.push({
                        'message': 'is mandatory',
                        'property': jsonClass.properties[property].name,
                        'URIProperty': jsonClass.properties[property].URI,
                        'valueProperty': null
                    });
                //If the property is recommended put a warning in the array  
                } else if(jsonClass.properties[property].required == 'recommended') {

                    //Check if the specific array already exists
                    if(feedback['warnings'][className + ' ' + URI] == undefined) {
                        feedback['warnings'][className + ' ' + URI] = {
                            'class': className,
                            'URIClass': URI,
                            'error': []
                        };
                    }

                    //Push all the information about the error into the array
                    feedback['warnings'][className + ' ' + URI].error.push({
                        'message': 'is recommended',
                        'property': jsonClass.properties[property].name,
                        'URIProperty': jsonClass.properties[property].URI,
                        'valueProperty': null
                    });
                }
            }
        }
    }
};

//Method to check if the a certain class is already validated before
var isClassChecked = function(className, URI) {
    var checked = false;

    //loop over all the uri's of the already validated classes
    for(uriClass in checkedClasses) {
        if(checkedClasses[uriClass] == className + ' class: ' + URI) {
            checked = true;
            break;
        }
    }

    return checked;
};