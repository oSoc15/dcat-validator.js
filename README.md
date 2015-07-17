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

```
<script src="dcat-validator.bundle.js"></script>
<script>
var feedback = validate('testDCATstring', callback);

//console.log all errrors and warnings

//errors
for(resource in feedback['errors']) {
    for(error in feedback['errors'][resource]) {
        console.log(feedback['errors'][resource][error].error);
    }
}

//warnings
for(resource in feedback['warnings']) {
    for(error in feedback['warnings'][resource]) {
        console.log(feedback['warnings'][resource][error].error);
    }
}
</script>
```

## Author

Author: Stan Callewaert  
Company: open Summer of code 2015  
Partner: Flemish government