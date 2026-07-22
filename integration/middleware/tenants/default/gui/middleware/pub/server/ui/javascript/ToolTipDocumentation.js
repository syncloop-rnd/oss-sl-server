const DOCUMENTATION = {
    "docs/user-guide/control-structures/status": {
        "document": "To enable/disable the step. The default step is in enabled mode. If the status is selected as disabled in the step & its child and further steps will not execute when the flow service will be invoked either from HTTP or from another service.",
        "popup": {
            "title": "Status",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/snapshot": {
        "document": "This creates a runtime data state snapshot for the step for debugging. There are three types of snapshots possible <br /><br />" +
            "" +
            "**Disabled**: The snapshot is disabled for the step.<br /><br />" +
            "**Enabled**: The snapshot is enabled for the step.<br /><br />" +
            "**Conditional**: The snapshot is enabled only when the snap condition is true.",
        "popup": {
            "title": "Snapshot",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/snapcondition": {
        "document": "The snapshot is enabled only when the **snap condition** is true.",

    },
    "docs/user-guide/control-structures/comment": {
        "document": " Add a comment in step."
    },
    "docs/user-guide/control-structures/enable-condition-sub-steps": {
        "document": "When this is made true the nested Groups will be evaluated for a condition. When the condition is true then only the nested Groups will be executed. This aids in controlling each individual nested Group."
    },
    "docs/user-guide/control-structures/condition": {
        "document": "The condition is evaluated based on relational and logical operators. When the result is true, the nested steps of the condition will be executed. You can write a JavaScript expression to evaluate your condition to execute its child steps. [Read](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/transformer#EvaluateExpression) how to evaluate expression\n" +
            "\n" +
            "* *Enabled when parent's \"Enable condition evaluation on sub-step(s)\" is enabled.*",
        "popup": {
            "title": "Condition",
            "description": "#ref",
            "uses": "* [Conditional Groups](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/group)\n" +
                "* [If-Else](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/ifelse)\n" +
                "* [Redo](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/redo)\n" +
                "* [Custom Mapping](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/transformer)",
            "example": "* `#{xpathVar1} > #{xpathVar2}`\n" +
                "* `\"#{xpath}\".length > 10` or `\"#{xpath}\" == \"StringOperations\"`\n"
        }
    },

    "docs/user-guide/control-structures/if-condition": {
        "document": "The condition is evaluated based on relational and logical operators. When the result is true, the nested steps of the condition will be executed. You can write a JavaScript expression to evaluate your condition to execute its child steps. [Read](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/transformer#EvaluateExpression) how to evaluate expression",
        "popup": {
            "title": "If-Else Condition",
            "description": "#ref",
            "uses": "* [Conditional Groups](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/group)\n" +
                "* [If-Else](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/ifelse)\n" +
                "* [Redo](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/redo)\n" +
                "* [Custom Mapping](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/transformer)",
            "example": "* `#{xpathVar1} > #{xpathVar2}`\n" +
                "* `\"#{xpath}\".length > 10` or `\"#{xpath}\" == \"StringOperations\"`\n"
        }
    },
    "docs/user-guide/control-structures/switch-var": {
        "document": "Put the name of variable to evaluate in CASE.\n * *Variable is not required to use #{} around it.*",
        "popup": {
            "title": "Switch",
            "description": "#ref",
            "uses": "",
            "example": "If in the pipeline a variable is create with name *OperationTypes*. In this case, just put OperationTypes in switch"
        }
    },
    "docs/user-guide/control-structures/case": {
        "document": "You can put the following data/keywords to execute\n" +
            "\na) **Constants** Can use different types of single (Not an Array) constant values such as String, integer, Date, Number, and Boolean but Document, Byte, and Object are not accepted.\n" +
            "\n" +
            "b) **#default** This is similar to the default statements in other programming languages. When none of the cases will be matched in that case it will execute.\n" +
            "\n" +
            "c) **#null** Syncloop offers one more keyword along with the default. In case the variable will be null, not assigned in the pipeline, or doesn’t exist, in that case, #null will execute. This #null case is not mandatory and API service will never be broken in case of null data.\n" +
            "\n" +
            "d) **regex** You also can add a regex *e.g. `#regex:.*json.*` if json contained in string*.",
        "popup": {
            "title": "CASE",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/input-list": {
        "document": "The input list (in the form of the array) will be given as input. The value of the input list will be the XPath of the variable. The ForEach will always work on the input list and will traverse each element of the list (Array). This array is specified as the input parameter.",
        "popup": {
            "title": "Input List",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/output-list": {
        "document": "The output list (in the form of the array) will be generated from the input list. The value of the output list will be the XPath of the variable and is specified as the output parameter. The only consideration that has to be kept there is that the list/array should not have existed before in the service or else this will create a conflict.",
        "popup": {
            "title": "Output List",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/loop-index-var": {
        "document": "Specify the variable name it has the loop iteration index count. default is *index you can change it later",
        "popup": {
            "title": "Index Variable",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/list-type": {
        "document": "This describes the type of output list. This list type will be applicable to Input List. This type can include Document, Object, String, Integer, Boolean, Number, Byte, and Date.",
        "popup": {
            "title": "List Type",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/repeat-index-var": {
        "document": "Specify the variable name it has the loop iteration index count. default is *index you can change it later",
        "popup": {
            "title": "Index Variable",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/repeat-interval": {
        "document": "This sets the delay in every Redo iteration. The interval value, measured in milliseconds, pauses the Redo iteration for the specified amount of time.",
        "popup": {
            "title": "Interval",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/repeat-times": {
        "document": "This specifies the number of times the repeat function is to be performed. The value is always an integer.",
        "popup": {
            "title": "Repeat",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/repeat-on": {
        "document": "It specifies when the Redo step has to be implemented and has two events.\n" +
            "* **error**: When the Repeat-on option is kept on error, the Redo step gets executed on the occurrence of an error. It will not affect the delay or the interval values of the Redo step.\n" +
            "* **success**: When the Repeat-on option is kept on success, the Redo gets executed when the status of the Redo step is enabled.",
        "popup": {
            "title": "Repeat On",
            "description": "#ref",
            "uses": "",
            "example": "1. If you want make a retry call when external call failed use repeat on error.\n" +
                "2. Use success in all happy case."
        }
    },
    "docs/user-guide/control-structures/await-index-var": {
        "document": "Specify the variable name it has the loop iteration index count. default is *index you can change it later",
        "popup": {
            "title": "Index Variable",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/await-timeout": {
        "document": "Timeout in seconds for await thread. If timeout exceeded thread will be killed in the given time.",
        "popup": {
            "title": "Timeout",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/control-structures/execution-type": {
        "document": "**Asynchronous Services**\n" +
            "In this type of Service call, other API/Java/SQL services continue to operate while waiting for another service call to return. In the case of Asynchronous services, the code execution does not block (or wait) for the API call to return from the server. Execution continues on in your service, and when the call returns from the server, a callback service is executed. On the Syncloop platform, we create an object that stores the task info and the output. Whenever output is needed a service name Wait is called in which task id is given as input. It will wait for the task to complete, and once it is completed, it will populate the object with the new output.\n" +
            "\n" +
            "**Synchronous Services**" +
            "\n" +
            "In this type of Service call, other API/Java/SQL services wait until the service returns, and during this period, all other services are stopped. The code execution will block (or wait) for the API call to return before continuing. The service wait is achieved using a wait service that enables the application to wait for the service to get completely executed. This means that until a response is returned by the API, your application will not execute any further, which could be perceived by the user as latency or performance lag in your app. Making an API call synchronously can be beneficial, however, if there is code in your app that will only execute properly once the API response is received.\n" +
            "\n",
        "popup": {
            "title": "Execution Type",
            "description": "## Asynchronous Services\n" +
                "In this type of Service call, other API/Java/SQL services continue to operate while waiting for another service call to return. In the case of Asynchronous services, the code execution does not block (or wait) for the API call to return from the server. Execution continues on in your service, and when the call returns from the server, a callback service is executed. On the Syncloop platform, we create an object that stores the task info and the output. Whenever output is needed a service name Wait is called in which task id is given as input. It will wait for the task to complete, and once it is completed, it will populate the object with the new output.\n" +
                "\n" +
                "![alt text](https://docs.syncloop.com/assets/img/docs/controlstructures/service3.jpg)\n" +
                "\n" +
                "## Synchronous Services\n" +
                "In this type of Service call, other API/Java/SQL services wait until the service returns, and during this period, all other services are stopped. The code execution will block (or wait) for the API call to return before continuing. The service wait is achieved using a wait service that enables the application to wait for the service to get completely executed. This means that until a response is returned by the API, your application will not execute any further, which could be perceived by the user as latency or performance lag in your app. Making an API call synchronously can be beneficial, however, if there is code in your app that will only execute properly once the API response is received.\n" +
                "\n" +
                "![alt text](https://docs.syncloop.com/assets/img/docs/controlstructures/service4.jpg)",
            "uses": "Use Await get capture all result from a recent asynchronous services",
            "example": ""
        }
    },
    "docs/user-guide/variables-and-datatypes/types": {
        "document": "Change the type to the new type. If variable is mapped/assigned a value then it can not be changed.\n" +
            "\n" +
            "The Syncloop platform builds and operates API services that communicate through input and output parameters to exchange data. The input section generates request data variables for the API service, whereas the output parameters receive data provided by the service. To optimize data exchange on the platform, diverse variables are utilized to cater to varying needs and requirements.",
        "popup": {
            "title": "Type",
            "description": "**Variables, Datatypes, and Objects**\n<br />" +
                "The Syncloop platform builds and operates API services that communicate through input and output parameters to exchange data. The input section generates request data variables for the API service, whereas the output parameters receive data provided by the service. To optimize data exchange on the platform, diverse variables are utilized to cater to varying needs and requirements. \n" +
                "\nThe various variables used on the Syncloop platform are discussed below:\n\n" +
                "1. **Document**\n\n" +
                "   A document variable is essentially an object that consists of a key-value pair. To simplify the process of creating a document, there are a number of pre-defined document type variables that are available on the Syncloop Platform. The comprehensive list of these inbuilt document type variables is provided in teh in the table below:\n\n" +
                "     * *payload: *payload is a pre-defined parameter which can be populated from the request payload based on the Content-Type in the request header. It is populated only when the API service is called as an external resource (i.e. RestWS). Supported Content-Types, application/json, application/xml, application/yml. **When a *payload is created in an API service, then that service will automatically convert in POST HTTP-Method.**\n\n" +
                "     * *requestHeaders: *requestHeaders is a pre-defined parameter which is populated from the Request Headers. It is populated only when the API service is called as an external resource (i.e. RestWS).\n\n" +
                "     * *pathParameters: *pathParameters is a pre-defined parameter that populates variables defined in the URL alias for the API service. These parameters can be created in any order. **The Parameter's name should exactly match with the URL alias.**\n\n" +
                "     * *2xx: \tThis is the pattern for response: when the API service is invoked as an API call & status code is between 200 - 299, then the response will be injected in 2xx. The specific status codes' responses like 200 and 201 will be injected in to the most closed status codes.\n\n" +
                "     * *4xx: This is the pattern for response: when the API service is invoked as an API call & status code is between 400 - 499, then the response will be injected in 4xx. The specific status codes' responses like 400 and 401 will be injected in to the most closed status codes.\n\n" +
                "     * *5xx: This is the pattern for response: when the API service is invoked as an API call & status code is between 500 - 599, then the response will be injected in 5xx. The specific status codes' responses like 500 and 501 will be injected in to the most closed status codes.\n\n" +
                "   The document type variables can\n\n" +
                "     * be represented as array\n\n" +
                "     * have child variables of any datatypes including document types.\n\n" +
                "     * have any number of child variable levels of any defined type." +
                "2. **String**\n\n" +
                "   The string variable can store a sequence of characters, including alphanumeric values such as letters and numbers, as well as special characters. These special characters can include under-score, hiphen etc characters.\n\n" +
                "3. **Integer**\n\n" +
                "   The integer variable basically represents whole numbers (no fractional parts).\n\n" +
                "4. **Number**\n\n" +
                "   The number variable supports numeric values of both integer and double types.\n\n" +
                "5. **Date**\n\n" +
                "   The date datatype is used to store date values.\n\n" +
                "6. **Boolean**\n\n" +
                "   Boolean variable represents logical values. It can hold only two values, namely true and false.\n\n" +
                "7. **Byte**\n\n" +
                "   BYTE data type variable stores binary data. Data can also be in the form of a byte stream, like images, voice patterns, etc.\n\n" +
                "8. **Object**\n\n" +
                "   This is used for handling complex data types. It can either be user-defined (custom) or built-in.\n\n",
            "uses": "",
            "example": "**Integer**: `1,2,3`\n\n" +
                "**String**: `Hello World`\n\n" +
                "**Number**: `1.0, 2.0`\n\n" +
                "**Date**: `01-01-1970`\n\n" +
                "**Boolean**: `true,false`\n\n"
        }
    },
    "docs/user-guide/variables-and-datatypes/anarray": {
        "document": "Convert current variable to an array type or vice-versa.",
        "popup": {
            "title": "It's an array",
            "description": "#ref",
            "uses": "",
            "example": "**Integer**: `[1,2,3]`\n\n" +
                "**String**: `[\"Hello\",\"World\"]`\n\n" +
                "**Number**: `[1.0, 2.0]`\n\n" +
                "**Date**: `[\"01-01-1970\"]`\n\n" +
                "**Boolean**: `[true,false]`\n\n"
        }
    },
    "docs/user-guide/variables-and-datatypes/required": {
        "document": "Variable is required otherwise service will throw an error."
    },
    "docs/user-guide/variables-and-datatypes/validation": {
        "document": "To restrict input value to a specific type.",
        "popup": {
            "title": "Validation",
            "description": "#ref",
            "uses": "",
            "example": "**Email, URL**"
        }
    },
    "docs/user-guide/variables-and-datatypes/regex": {
        "document": "It uses a regular expression for evaluation and validation. This involves the matching of strings or texts held by the variable.",
        "popup": {
            "title": "Validation",
            "description": "#ref",
            "uses": "",
            "example": "For Email: `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/`\n\n" +
                "For 16 digits CC `1234-5678-9012-3456`: `/^(\\d{4}-){3}\\d{4}$/`"
        }
    },
    "docs/user-guide/variables-and-datatypes/minlength": {
        "document": "This validates the string for minimum size. If the minimum size value is entered, then the length of the string has to be greater than or equal to the minimum size."

    },
    "docs/user-guide/variables-and-datatypes/maxlength": {
        "document": "This validates the string for the maximum size. If the max size value is entered, then the length of the string has to be less than or equal to the maximum size."
    },
    "docs/user-guide/variables-and-datatypes/fieldDescription": {
        "document": "It provides some additional information about the variable."
    },
    "docs/user-guide/variables-and-datatypes/default_value": {
        "document": "The variables are comprised of a set of properties and default values once we try to access their properties. The default values assigned to these variables determine the source of their values. The table below outlines the different types of sources from which the variables can be populated with their default values.",
        "popup": {
            "title": "Default Value",
            "description": "#ref",
            "uses": "",
            "example": "**Value**: The integer value of the variable\n\n" +
                "**None**: Value is an Integer value\n\n" +
                "**Evaluate Expression**: Value is the outcome of an expression.\n\n" +
                "**Evaluate Local Configuration Variable**: Value is assigned from a local configuration variable defined in the Configuration properties dialog\n\n" +
                "**Evaluate Package Configuration Variable**: Value is assigned from a package configuration variable stored in the local package in the dependency folder\n\n" +
                "**Evaluate Global Configuration Variable**: Value is assigned from a global configuration variable stored in the global package's dependency folder\n\n"
        }
    },
    "docs/user-guide/variables-and-datatypes/minimumNumber": {
        "document": "It allows the minimum value and ensures that the variable should have a value that is greater than or equal to the minimum value."
    },
    "docs/user-guide/variables-and-datatypes/maximumNumber": {
        "document": "It allows the maximum value and ensures that the variable should have a value that is less than or equal to the maximum value."
    },
    "docs/user-guide/variables-and-datatypes/decimalFormat": {
        "document": "It provides the decimal format of the number i.e. Places of decimal."
    },
    "docs/user-guide/variables-and-datatypes/dateFormat": {
        "document": "Specifies the input for the date variable. Eg: Input can be DD-MM-YYYY Format.",
        "popup": {
            "title": "Date Format",
            "description": "#ref",
            "uses": "",
            "example": "If invoking service will pass a date variable in different format e.g. `12 Aug, 1990` then this service need to specify that **Date Format** (*Same rule will apply on API call*)"
        }
    },
    "docs/user-guide/variables-and-datatypes/toDateFormat": {
        "document": "This specifies the output of the date variable. For example, the above format can be converted into another date format like YYYY-MM-DD. It can be customized into any other date format.",
        "popup": {
            "title": "To Date Format",
            "description": "#ref",
            "uses": "",
            "example": "If  a date variable in different format and you want to convert into a another format then this service need to specify that in **To Date Format** (*Same rule will apply on API call*)\n\n" +
                "e.g. If date is presented in `12 Aug, 1990` format and you want it in `12-08-1990`"
        }
    },
    "docs/user-guide/variables-and-datatypes/startDate": {
        "document": "Specifies the start date for variable validation."
    },
    "docs/user-guide/variables-and-datatypes/endDate": {
        "document": "Specifies the end date for variable validation."
    },
    "docs/user-guide/transformer/set-value/evaluate-expression": {
        "document": "This approach is faster",
        "popup": {
            "title": "Evaluate as substitution",
            "description": "#ref"
        }
    },
    "docs/user-guide/transformer/set-value": {
        "document": "The variables are comprised of a set of properties and default values once we try to access their properties. The default values assigned to these variables determine the source of their values. The table below outlines the different types of sources from which the variables can be populated with their default values.",
        "popup": {
            "title": "Default Value",
            "description": "#ref",
            "uses": "",
            "example": "" +
                "**None**: A constant value can be assigned to the variable. These constants can use different types of single (Not an Array) constant values such as String, integer, Date, Number, and Boolean but Document, Byte, and Object are not accepted.\n\n" +
                "**Evaluate Expression:** This option will work upon native JavaScript & it executes one line JavaScript expression. You can access your pipeline's variables alone with the expression. Here are some example of expressions.\n" +
                "* `#{xpath}` or `#{xpathVar1} + #{xpathVar2}`\n" +
                "* `#{xpathVar1} > #{xpathVar2}`\n\n" +
                "* `Math.sqrt(2)` or `10 + 2 / 10`\n\n" +
                "* `\"#{xpath}\".length > 10` or `\"#{xpath}\" == \"StringOperations\"`\n\n" +
                "* `\"#{xpath}\".trim()`\n\n" +
                "* *Only Native JavaScript code will be executed*.\n\n" +
                "* *Create a correct DataType variable for evaluated result. e.g. if after evaluated result will be boolean so it couldn't stored in string variable*\n\n\n" +

                "**Evaluate Local Configuration Variable**: If selected this option it will fetch mentioned variable in the expression from the local properties instead of the pipeline. These variables can use different types of single (Not an Array) constant values such as String, integer, Date, Number, and Boolean but Document, Byte, and Object are not accepted. Each variable is represented by its XPath.\n\n Here are some example of expressions.\n\n" +
                "* `#{xpath}` or `#{xpathVar1} + #{xpathVar2}`\n\n" +
                "* `#{xpathVar1} > #{xpathVar2}`\n\n" +
                "* `Math.sqrt(2)` or `10 + 2 / 10`\n\n" +
                "* `\"#{xpath}\".length > 10` or `\"#{xpath}\" == \"StringOperations\"`\n\n" +
                "* `\"#{xpath}\".trim()`\n\n" +
                "* `\"#{xpath}\"` will be resolved from local properties.\n\n" +
                "* *Only Native JavaScript code will be executed*.\n\n" +
                "* *Create a correct DataType variable for evaluated result. e.g. if after evaluated result will be boolean so it couldn't stored in string variable*\n\n\n" +

                "**Evaluate Package Configuration Variable**: If selected this option it will fetch mentioned variable in the expression from the package properties instead of the pipeline. These variables can use different types of single (Not an Array) constant values such as String, integer, Date, Number, and Boolean but Document, Byte, and Object are not accepted. Each variable is represented by its XPath.\n\n Here are some example of expressions.\n\n" +
                "* `#{xpath}` or `#{xpathVar1} + #{xpathVar2}`\n\n" +
                "* `#{xpathVar1} > #{xpathVar2}`\n\n" +
                "* `Math.sqrt(2)` or `10 + 2 / 10`\n\n" +
                "* `\"#{xpath}\".length > 10` or `\"#{xpath}\" == \"StringOperations\"`\n\n" +
                "* `\"#{xpath}\".trim()`\n\n" +
                "* `\"#{xpath}\"` will be resolved from package properties.\n\n" +
                "* *Only Native JavaScript code will be executed*.\n\n" +
                "* *Create a correct DataType variable for evaluated result. e.g. if after evaluated result will be boolean so it couldn't stored in string variable*\n\n\n" +

                "**Evaluate Global Configuration Variable**:  If selected this option it will fetch mentioned variable in the expression from the global properties instead of the pipeline.\n\nHere are some example of expressions.\n\n" +
                "* `#{xpath}` or `#{xpathVar1} + #{xpathVar2}`\n\n" +
                "* `#{xpathVar1} > #{xpathVar2}`\n\n" +
                "* `Math.sqrt(2)` or `10 + 2 / 10`\n\n" +
                "* `\"#{xpath}\".length > 10` or `\"#{xpath}\" == \"StringOperations\"`\n\n" +
                "* `\"#{xpath}\".trim()`\n\n" +
                "* `\"#{xpath}\"` will be resolved from global properties.\n\n" +
                "* *Only Native JavaScript code will be executed*.\n\n" +
                "* *Create a correct DataType variable for evaluated result. e.g. if after evaluated result will be boolean so it couldn't stored in string variable*\n\n\n"
        }
    },
    "docs/user-guide/transformer/path-from": {
        "document": "This is the XPath Source Variable. This is also an editable fields in case of array and you can mention a particular index to map from a specific position. You can either put constant integer or use `#{xpath}` variable from pipeline.",
        "popup": {
            "title": "Path From",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/transformer/path-to": {
        "document": "This is the XPath destination Variable. This is also an editable fields in case of array and you can mention a particular index to map from a specific position. You can either put constant integer or use `#{xpath}` variable from pipeline\n" +
            "    Method Some default function methods are provided including custom methods. If the method is selected as the custom then we need to explicitly specify the code in the function.  The method can take any of the values.",
        "popup": {
            "title": "Path To",
            "description": "#ref",
            "uses": "",
            "example": ""
        }
    },
    "docs/user-guide/transformer/custom-methods": {
        "document": "Apply the custom operation with mapped data while data passing.",
        "popup": {
            "title": "Custom Method",
            "description": "#ref",
            "uses": "**trim:** The value of the source variable will be trimmed (right and left blank Spaces removed) before assigning it to the destination variables.\n" +
                "\n" +
                "**emptyToNull:** The value of the source variable will be changed from empty to Null before assigning it to the destination variable.\n" +
                "\n" +
                "**blankToNull:** The value of the source variable will be changed from blank value to Null before assigning it to the destination variable.\n" +
                "\n" +
                "**numberToString:** The value of the source variable will be changed from number to string before assigning it to the destination variable.\n" +
                "\n" +
                "",
            "example": ""
        }
    },
    "docs/user-guide/transformer/condition": {
        "document": "The condition is evaluated based on relational and logical operators. When the result is true, the nested steps of the condition will be executed. You can write a JavaScript expression to evaluate your condition to execute its child steps. [Read](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/transformer#EvaluateExpression) how to evaluate expression",
        "popup": {
            "title": "If-Else Condition",
            "description": "#ref",
            "uses": "* [Conditional Groups](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/group)\n" +
                "* [If-Else](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/ifelse)\n" +
                "* [Redo](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/redo)\n" +
                "* [Custom Mapping](https://docs.syncloop.com/docs/user-guide/dashboard/workspace/services/api/control-structures/transformer)",
            "example": "* `#{xpathVar1} > #{xpathVar2}`\n" +
                "* `\"#{xpath}\".length > 10` or `\"#{xpath}\" == \"StringOperations\"`\n"
        }
    },
    "docs/user-guide/transformer/function-def": {
        "document": "The custom will provide an option to the developer to have a custom transformation function from the     source variable to the destination. When the custom option is selected the function text box if populated with the relevant JavaScript code.",
        "popup": {
            "title": "Custom Function",
            "description": "The custom will provide an option to the developer to have a custom transformation function from the     source variable to the destination. When the custom option is selected the function text box if populated with the relevant JavaScript code.\n" +
                "\n" +
                "```\n" +
                "    function (val){\n" +
                "        return val;\n" +
                "    }\n" +
                "```\n" +
                "Using this function, the developer can specify its own configuration mapping JavaScript code which can be changed and modified accordingly.\n",
            "uses": "",
            "example": "1. " +
                "\n" +
                "```\n" +
                "    function (val){\n" +
                "       val = parseInt(val) * 10\n" +
                "        return val;\n" +
                "    }\n" +
                "```\n" +
                "2. " +
                "\n" +
                "```\n" +
                "    function (val){\n" +
                "       val = parseInt(val) * #{numberVariable}\n" +
                "        return val;\n" +
                "    }\n" +
                "```\n"
        }
    },
    "docs/user-guide/service/api/configuration/title": {
        "document": "Title of the service."
    },
    "docs/user-guide/service/api/configuration/description": {
        "document": "Brief description of the service."
    },
    "docs/user-guide/service/api/configuration/enable-validation": {
        "document": "Enabling validation on the service for input parameters"
    },
    "docs/user-guide/service/api/configuration/enable-graphQL": {
        "document": "Enable graphQL support for this service."
    },
    "docs/user-guide/service/api/configuration/method": {
        "document": "Set HTTP method to access this service from API."
    },
    "docs/user-guide/service/api/configuration/alias": {
        "document": "Change API endpoint & also add path variables in alias",
        "popup": {
            "title": "Alias",
            "description": "#ref",
            "uses": "",
            "example": "`/example/endpoint` <br /> `/service/{userId}/{sessionId}` (With Path Parameters)."
        }
    },
    "docs/user-guide/service/api/configuration/service-endpoint": {
        "document": "Public endpoint of the service to access as API"
    },
    "docs/user-guide/service/api/configuration/consumers": {
        "document": "Specifies the consumers groups whose API token have the access to this API."
    },
    "docs/user-guide/service/api/configuration/developers": {
        "document": "Specifies the developer groups that have an access to modify this API"
    },
    "docs/user-guide/service/api/configuration/configuration-properties": {
        "document": "The local properties (Key/Value)",
        "popup": {
            "title": "Alias",
            "description": "#ref",
            "uses": "",
            "example": "`syncloop.prop1=Value1` <br /> `syncloop.prop2=Value2`"
        }
    },
    "docs/user-guide/api/clone": {
        "document": "API service can be cloned i.e. an exact copy of the service can be created and stored in any of the packages by modifying the service path devined in the clone dialog."
    },
    "docs/user-guide/control-structures/debugging": {
        "document": "Simulate the snapshot for debugging."
    },
    "docs/user-guide/variables-and-datatypes/javawrapper": {
        "document": "Java wrapper class. You can change it to restrict data type."
    }
}
