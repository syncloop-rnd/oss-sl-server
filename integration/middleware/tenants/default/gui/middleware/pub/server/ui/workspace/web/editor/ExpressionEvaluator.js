(function (global) {
    let values = {};
    let expression;
	let paramModal="paramModal";
	let paramForm=paramModal+"-paramForm";
	let action="condition";
	const regexExp = /#\{([a-zA-Z0-9_/*]+)\}/g;
	global.init= function(pmID){
		paramModal=pmID;
		paramForm=paramModal+"-paramForm"
	}
	function replaceAll(inputStr, searchStr, replaceStr) {
		let result = "";
		let index = 0;
		let searchLen = searchStr.length;

		while (index < inputStr.length) {
			if (inputStr.substr(index, searchLen) === searchStr) {
				result += replaceStr;
				index += searchLen;
			} else {
				result += inputStr[index];
				index++;
			}
		}

		return result;
	}
    function internalEvaluateBooleanExpression(expr) {
		
		let match;
		const params = new Set();
		while (match = regexExp.exec(expr)) {
			params.add(match[1]);
		}

		let modifiedExpr = expr;
		for (let [param, value] of Object.entries(values)) {
			modifiedExpr=replaceAll(modifiedExpr,"#{" + param + "}", value === null ? "null" : value);
		}

		try {
			console.log(modifiedExpr);
			let result = eval(modifiedExpr);
			console.log(result);
			if (typeof result === "string") {
				result = result.toLowerCase() === "true" ? true : (result.toLowerCase() === "false" ? false : !!result);
			} else if (typeof result === "number") {
				result = result === 1;
			}
			return result;
		} catch (error) {
			console.error("An error occurred while evaluating the expression:", error);
			return null;
		}
	}

	
	function internalEvaluateMathExpression(expr) {

		let match;
		const params = new Set();
		while (match = regexExp.exec(expr)) {
			params.add(match[1]);
		}

		let modifiedExpr = expr;
		for (let [param, value] of Object.entries(values)) {
			modifiedExpr=replaceAll(modifiedExpr,"#{" + param + "}", value === null ? "null" : value);
		}

		try {
			console.log(modifiedExpr);
			return Number(eval(modifiedExpr));
		} catch (error) {
			console.error("An error occurred while evaluating the mathematical expression:", error);
			return NaN;  // Using NaN (Not-a-Number) to indicate the evaluation failed.
		}
	}



    function openModal(params) {
        const form = document.getElementById(paramForm);
        form.innerHTML = "";

        params.forEach(param => {
            const label = document.createElement("label");
            label.innerText = param;

            const input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("id", param);
            input.setAttribute("name", param);
			input.setAttribute("class","form-control");

            form.appendChild(label);
            form.appendChild(input);
        });

        document.getElementById(paramModal).style.display = "block";
    }

    function closeModal() {
        const params = document.querySelectorAll("#"+paramForm+" input");
        params.forEach(param => {
            const value = param.value.trim();
			let val = value === "" ? null : value;
            values[param.name] = val;// === "" ? null : value;
			console.log(param.name);
			console.log(value);
        });

        document.getElementById(paramModal).style.display = "none";
    }

    function internalProcessExpression(expr) {
        expression = expr;

        //const regex = /#\{([a-zA-Z0-9_]+)\}/g;
        const paramsSet = new Set();
        let match;
        while (match = regexExp.exec(expr)) {
            paramsSet.add(match[1]);
        }

        openModal([...paramsSet]);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const submitButton = document.querySelector("#"+paramModal + " button");
        if (submitButton) {
            submitButton.addEventListener("click", function () {
                closeModal();
				let result=null;
				if(action=="condition")
					result = internalEvaluateBooleanExpression(expression);
				else
					result = internalEvaluateMathExpression(expression);
                if (typeof global.onExpressionEvaluation === "function") {
						global.onExpressionEvaluation(result);
						
                }
            });
        }
    });

    global.evaluateBooleanExpression = function (expr, callback) {
		action="condition";
        global.onExpressionEvaluation = callback;
        internalProcessExpression(expr);
    };
	
	global.evaluateMathExpression = function (expr, callback) {
		action="maths";
        global.onExpressionEvaluation = callback;
        internalProcessExpression(expr);
    };

})(window);
