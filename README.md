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
<script src="bundle.js"></script>
<script>
var feedback = validate('testDCATstring', callback);

//console.log all errrors and warnings

//errors
for(i = 0; i < feedback['errors'].length; i++) {
    console.log(feedback['errors'][i].error);
}

//warnings
for(i = 0; i < feedback['warnings'].length; i++) {
   console.log(feedback['warnings'][i].error);
}
</script>
```

## Author

Author: Stan Callewaert  
Company: open Summer of code 2015  
Partner: Flemish government