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
const requestHandler = (url,method,success,error,data={},options={})=>{
    $.ajax({
        url,
        method,
        data,
        success,
        error,
        ...options,
    });
}
function slideAnimation(element,container){
    $({ x: 0 }).animate(
        { x: $(container).width() },
        {
            duration: 1000,
            step: function (val) {
                element.css("transform", `translateX(${val}px)`);
            },
            done: function () {
                element.remove();
            },
        }
    );
}
const handleRequestErrors = (errors) => {
    const errorsJson = errors.responseJSON;
    if(errorsJson.status===401){
        window.location.href="/login"
        return 
    }
    if (errorsJson.status === 403){
        window.location.href="/"
        return
    }
    console.log(errorsJson);
    $(`input, select`).removeClass("is-invalid is-valid");
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
        for (const [constraint, schema] of Object.entries(validation)) {
            if (
                (constraint === "required" && inputVal === "") ||
                schema?.notIn?.includes(inputVal)
            ) {
                $(`#invalid-${input}`).text(schema.message);
                validField = false;
                break;
            }
            if (constraint === "length") {
                if (
                    inputVal.length < schema.min ||
                    inputVal.length > schema.max
                ) {
                    $(`#invalid-${input}`).text(schema.message);
                    validField = false;
                    break;
                }
            }
            if (constraint === "limit") {
                if (
                    parseInt(inputVal) < schema.min ||
                    parseInt(inputVal) > schema.max
                ) {
                    $(`#invalid-${input}`).text(schema.message);
                    validField = false;
                    break;
                }
            }
            if (constraint === "regex") {
                if (!schema.regex.test(inputVal)) {
                    $(`#invalid-${input}`).text(schema.message);
                    validField = false;
                    break;
                }
            }
            if(constraint==="isNumber"){
                const val = parseInt(inputVal)
                if(val!==0&&!val){
                    $(`#invalid-${input}`).text(schema.message);
                    validField = false;
                    break;        
                }
            }
            if(constraint==="isEmail"){
                if(!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(inputVal)){
                    $(`#invalid-${input}`).text(schema.message);
                    validField = false;
                    break;        
                }
            }
        }
        if (!validField) {
            valid = false;
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
function getStateClass(state) {
    if (state === "NOT_CONFIRMED" || state === "غير مؤكد") {
        return "bg-gradient-dark text-white rounded p-1";
    } else if (state === "مؤكد" || state === "CONFIRMED") {
        return "bg-gradient-success text-white rounded p-1";
    } else if (state === "جاهز" || state === "READY") {
        return "bg-gradient-primary text-white rounded p-1";
    } else if (state === "انتظار" || state === "WAITING") {
        return "bg-gradient-primary text-white rounded p-1";
    } else if (state === "في التوصيل" || state === "IN_DELIVERY") {
        return "bg-gradient-info text-white rounded p-1";
    } else if (state === "تم الغاءة" || state === "CANCELED") {
        return "bg-gradient-danger text-white rounded p-1";
    } else if (state === "رفض الاستلام" || state === "REFUSED") {
        return "bg-gradient-danger text-white rounded p-1";
    } else if (state === "تم الاستلام" || state === "DELIVERED") {
        return "bg-gradient-success text-white rounded p-1";
    }
}
