const win = window.navigator.platform.indexOf("Win");
if (document.querySelector('#sidenav-scrollbar')) {
    const options = {
        damping: '0.5'
    }
Scrollbar.init(document.querySelector('#sidenav-scrollbar'), options);
}

/**
 * 
 * @param {string} url 
 * @param {"POST"|"GET"|"DELETE"|"PUT"} method 
 * @param {Function} success 
 * @param {Function} error 
 * @param {Object} data 
 * @param {Object} headers 
 */
const submitHandler = (url,method,success,error,data={},options={})=>{
    $.ajax({
        url,
        method,
        data,
        success,
        error,
        ...options,
    });
}

const handleRequestErrors = (errors) => {
    const errorsJson = errors.responseJSON;
    console.log(errorsJson)
    $(".is-invalid").removeClass("is-invalid");
    if (errorsJson.code === "VALIDATION") {
        for (const [input, feedback] of Object.entries(errorsJson.errors)) {
            $(`#${input}`).addClass("is-invalid");
            $(`#invalid-${input}`).text(feedback);
        }
    } else {
        addAlert("danger", errorsJson.message);
    }
};
const addAlert = (type, message) => {
    const area = $("#alerts-area");
    if (area.children().length>= 3) {
        area.empty();
    }
    area.append(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
    <span class="alert-text">${message}.</span>
    <button type="button" class="btn-close rtl" data-bs-dismiss="alert" aria-label="Close"></button></div>`);
};
const validateInput = (toValidate) => {
    let valid = true;
    for (const [input, validation] of Object.entries(toValidate)) {
        const inputVal = $(`#${input}`).val();
        let validField = true;
        $(`#${input}`).removeClass("is-invalid is-valid");
        for (const [constraint, value] of Object.entries(validation)) {
            if (
                (constraint === "required" && inputVal === "") ||
                value?.notIn?.includes(inputVal)
            ) {
                $(`#invalid-${input}`).text(value.message);
                valid = false;
                validField = false;
                continue;
            }
            if (constraint === "length") {
                if (
                    inputVal.length < value.min ||
                    inputVal.length > value.max
                ) {
                    $(`#invalid-${input}`).text(value.message);
                    valid = false;
                    validField = false;
                    continue;
                }
            }
            if (constraint === "limit") {
                if (
                    parseInt(inputVal) < value.min ||
                    parseInt(inputVal) > value.max
                ) {
                    $(`#invalid-${input}`).text(value.message);
                    valid = false;
                    validField = false;
                    continue;
                }
            }
            if (constraint === "regex") {
                if (!value.regex.test(inputVal)) {
                    $(`#invalid-${input}`).text(value.message);
                    valid = false;
                    validField = false;
                    continue;
                }
            }
            if(constraint==="isNumber"){
                if(!parseInt(inputVal)){
                    $(`#invalid-${input}`).text(value.message);
                    valid = false;
                    validField = false;
                    continue;        
                }
            }
        }
        if (!validField) {
            $(`#${input}`).addClass("is-invalid");
        } else {
            $(`#${input}`).addClass("is-valid");
        }
    }
    return valid;
};
const showToast = (message)=>{
    const toast = $("#liveToast");
    toast.children(".toast-body").text(message)
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)
    toastBootstrap.show()
}
