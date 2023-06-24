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
const submitHandler = (url,method,success,error,data={},headers={})=>{
    $.ajax({
        url,
        method,
        data,
        headers,
        success,
        error,
    });
}

const addAlert = (type, message) => {
    const area = $("#alerts-area");
    if (area.children().length>= 3) {
        area.empty();
    }
    area.append(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
    <span class="alert-text">${message}.</span>
    <button type="button" class="btn-close rtl" data-bs-dismiss="alert" aria-label="Close"></button></div>`);
};
