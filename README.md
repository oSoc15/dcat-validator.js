# DCAT validation library

Validates a DCAT turtle feed.

## Installation

```
npm install
```

## Build

```
browserify validator.js -o ./build/dcat-validator.bundle.js
```

## Usage

### Log errors and warnings

```
<script src="dcat-validator.bundle.js"></script>
<script>
var feedback = validate('DCATstring', validatorRules, callback);

//console.log all errrors and warnings

//errors
for(resource in feedback['errors']) {
    for(error in feedback['errors'][resource]) {
        console.log(feedback['errors'][resource][error].error);
    }
}

//warnings
for(resource in feedback['warnings']) {
    for(warning in feedback['warnings'][resource]) {
        console.log(feedback['warnings'][resource][warning].error);
    }
}
</script>
```

### The validationRules

This JSON array must be passed as the second argument to the validate function.
You can change the array to your needs but this is the standard JSON array:

```
var validatorRules = new Array();

validatorRules['mandatory'] =
{
    'Catalog': {
        'class': 'Catalog',
        'required': 'mandatory',
        'mutiple': false,
        'URI': 'http://www.w3.org/ns/dcat#Catalog',
        'properties': [ 
            {
                'name': 'type',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Resource',
                'URI': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                'multiple': false
            },
            {
                'name': 'title',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/title',
                'multiple': false
            },
            {
                'name': 'description',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/description',
                'multiple': false
            },
            {
                'name': 'issued',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/issued',
                'multiple': false
            },
            {
                'name': 'modified',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/modified',
                'multiple': false
            },
            {
                'name': 'language',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/language',
                'multiple': false
            },
            {
                'name': 'publisher',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'http://xmlns.com/foaf/0.1/Agent',
                'URI': 'http://purl.org/dc/terms/publisher',
                'multiple': false
            },
            {
                'name': 'themes',
                'prefix': 'dcat',
                'required': 'recommended',
                'Range': 'http://www.w3.org/2004/02/skos/core#ConceptScheme',
                'URI': 'http://purl.org/dc/terms/themeTaxonomy',
                'multiple': false
            },
            {
                'name': 'license',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/license',
                'multiple': false
            },
            {
                'name': 'rigths',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/rights',
                'multiple': false
            },
            {
                'name': 'spatial',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/spatial',
                'multiple': false
            },
            {
                'name': 'dataset',
                'prefix': 'dcat',
                'required': 'mandatory',
                'Range': 'http://www.w3.org/ns/dcat#Dataset',
                'URI': 'http://www.w3.org/ns/dcat#dataset',
                'multiple': true
            },
            {
                'name': 'record',
                'prefix': 'dcat',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://www.w3.org/ns/dcat#record',
                'multiple': false
            },
            {
                'name': 'homepage',
                'prefix': 'foaf',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://xmlns.com/foaf/0.1/homepage',
                'multiple': false
            }
        ]
    }
};

validatorRules['optional'] =
{
    'Agent': {
        'class': 'Agent',
        'required': 'mandatory',
        'mutiple': true,
        'URI': 'http://xmlns.com/foaf/0.1/Agent',
        'properties': [
            {
                'name': 'name',
                'prefix': 'foaf',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://xmlns.com/foaf/0.1/name',
                'multiple': true
            }
        ]
    },
    'Dataset': {
        'class': 'Dataset',
        'required': 'mandatory',
        'mutiple': true,
        'URI': 'http://www.w3.org/ns/dcat#Dataset',
        'properties': [
            {
                'name': 'type',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'http://www.w3.org/2004/02/skos/core#Concept',
                'URI': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                'multiple': false
            },
            {
                'name': 'title',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/title',
                'multiple': false
            },
            {
                'name': 'description',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/description',
                'multiple': false
            },
            {
                'name': 'issued',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/issued',
                'multiple': false
            },
            {
                'name': 'modified',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/modified',
                'multiple': false
            },
            {
                'name': 'language',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/language',
                'multiple': false
            },
            {
                'name': 'publisher',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'http://xmlns.com/foaf/0.1/Agent',
                'URI': 'http://purl.org/dc/terms/publisher',
                'multiple': false
            },
            {
                'name': 'accrualPeriodicity',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/publisher',
                'multiple': false
            },
            {
                'name': 'identifier',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/identifier',
                'multiple': false
            },
            {
                'name': 'temporal',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/temporal',
                'multiple': false
            },
            {
                'name': 'theme',
                'prefix': 'dcat',
                'required': 'recommended',
                'Range': 'http://www.w3.org/2004/02/skos/core#Concept',
                'URI': 'http://www.w3.org/ns/dcat#theme',
                'multiple': false
            },
            {
                'name': 'relation',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Resource',
                'URI': 'http://purl.org/dc/terms/relation',
                'multiple': false
            },
            {
                'name': 'keyword',
                'prefix': 'dcat',
                'required': 'recommended',
                'Range': 'Literal',
                'URI': 'http://www.w3.org/ns/dcat#keyword',
                'multiple': true
            },
            {
                'name': 'contactPoint',
                'prefix': 'dcat',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://www.w3.org/ns/dcat#contactPoint',
                'multiple': false
            },
            {
                'name': 'temporal',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/temporal',
                'multiple': false
            },
            {
                'name': 'spatial',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/spatial',
                'multiple': false
            },
            {
                'name': 'sample',
                'prefix': 'adms',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://www.w3.org/ns/adms#sample',
                'multiple': false
            },
            {
                'name': 'distribution',
                'prefix': 'dcat',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://www.w3.org/ns/dcat#distribution',
                'multiple': false
            },
            {
                'name': 'landingPage',
                'prefix': 'dcat',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://www.w3.org/ns/dcat#landingPage',
                'multiple': false
            }
        ]
    },
    'Distribution': {
        'class': 'Distribution',
        'required': 'recommended',
        'mutiple': true,
        'URI': 'http://www.w3.org/ns/dcat#Distribution',
        'properties': [
            {
                'name': 'title',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/title',
                'mutiple': false
            },
            {
                'name': 'description',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/description',
                'mutiple': false
            },
            {
                'name': 'issued',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/issued',
                'mutiple': false
            },
            {
                'name': 'modified',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/modified',
                'mutiple': false
            },
            {
                'name': 'language',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/language',
                'mutiple': false
            },
            {
                'name': 'license',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/license',
                'mutiple': false
            },
            {
                'name': 'rigths',
                'prefix': 'dct',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/rights',
                'mutiple': false
            },
            {
                'name': 'accessURL',
                'prefix': 'dcat',
                'required': 'optional',
                'Range': 'Resource',
                'URI': 'http://www.w3.org/ns/dcat#accessURL',
                'mutiple': false
            },
            {
                'name': 'downloadURL',
                'prefix': 'dcat',
                'required': 'mandatory',
                'Range': 'Resource',
                'URI': 'http://www.w3.org/ns/dcat#downloadURL',
                'mutiple': false
            },
            {
                'name': 'mediaType',
                'prefix': 'dcat',
                'required': 'optional',
                'Range': 'Anything',
                'URI': 'http://www.w3.org/ns/dcat#mediaType',
                'mutiple': false
            },
            {
                'name': 'format',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'Anything',
                'URI': 'http://purl.org/dc/terms/format',
                'mutiple': false
            },
            {
                'name': 'byteSize',
                'prefix': 'dcat',
                'required': 'optional',
                'Range': 'Decimal',
                'URI': 'http://www.w3.org/ns/dcat#byteSize',
                'mutiple': false
            }
        ]
    },
    'Concept': {
        'class': 'Concept',
        'required': 'mandatory',
        'mutiple': true,
        'URI': 'http://www.w3.org/2004/02/skos/core#Concept',
        'properties': [
            {
                'name': 'prefLabel',
                'prefix': 'skos',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://www.w3.org/2004/02/skos/core#prefLabel',
                'mutiple': false
            }
        ]
    },
    'ConceptScheme': {
        'class': 'ConceptScheme',
        'required': 'mandatory',
        'mutiple': false,
        'URI': 'http://www.w3.org/2004/02/skos/core#ConceptScheme',
        'properties': [
            {
                'name': 'title',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/title',
                'mutiple': false
            }
        ]
    },
    'CatalogRecord': {
        'class': 'CatalogRecord',
        'required': 'optional',
        'mutiple': false,
        'URI': 'http://www.w3.org/ns/dcat#CatalogRecord',
        'properties': [
            {
                'name': 'title',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/title',
                'mutiple': false
            },
            {
                'name': 'description',
                'prefix': 'dct',
                'required': 'mandatory',
                'Range': 'Literal',
                'URI': 'http://purl.org/dc/terms/description',
                'mutiple': false
            },
            {
                'name': 'issued',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/issued',
                'mutiple': false
            },
            {
                'name': 'modified',
                'prefix': 'dct',
                'required': 'recommended',
                'Range': 'DateTime',
                'URI': 'http://purl.org/dc/terms/modified',
                'mutiple': false
            },
            {
                'name': 'primaryTopic',
                'prefix': 'foaf',
                'required': 'mandatory',
                'Range': 'http://www.w3.org/ns/dcat#Dataset',
                'URI': 'http://xmlns.com/foaf/0.1/primaryTopic',
                'mutiple': false
            }
        ]
    },
    'LinguisticSystem': {
        'class': 'LinguisticSystem',
        'required': 'optional',
        'mutiple': false,
        'URI': 'http://purl.org/dc/terms/LinguisticSystem',
        'properties': [

        ]
    },
    'LicenseDocument': {
        'class': 'LicenseDocument',
        'required': 'recommended',
        'mutiple': false,
        'URI': 'http://purl.org/dc/terms/LicenseDocument',
        'properties': [

        ]
    },
    'Frequency': {
        'class': 'Frequency',
        'required': 'optional',
        'mutiple': false,
        'URI': 'http://purl.org/dc/terms/Frequency',
        'properties': [

        ]
    },
    'Document': {
        'class': 'Document',
        'required': 'optional',
        'mutiple': false,
        'URI': 'http://xmlns.com/foaf/0.1/Document',
        'properties': [

        ]
    }
};
```

## Author

Author: Stan Callewaert  
Company: open Summer of code 2015  
Partner: Flemish government