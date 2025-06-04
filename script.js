// script.js

let icon = {
    success:
    '<span class="material-symbols-outlined">task_alt</span>',
    danger:
    '<span class="material-symbols-outlined">error</span>',
    warning:
    '<span class="material-symbols-outlined">warning</span>',
    info:
    '<span class="material-symbols-outlined">info</span>',
};

const showToast = (
    message = "Sample Message",
    toastType = "info",
    duration = 5000) => {
    if (
        !Object.keys(icon).includes(toastType))
        toastType = "info";

    let box = document.createElement("div");
    box.classList.add(
        "toast", `toast-${toastType}`);
    box.innerHTML = ` <div class="toast-content-wrapper">
                      <div class="toast-icon">
                      ${icon[toastType]}
                      </div>
                      <div class="toast-message">${message}</div>
                      <div class="toast-progress"></div>
                      </div>`;
    duration = duration || 5000;
    box.querySelector(".toast-progress").style.animationDuration =
            `${duration / 1000}s`;
    box.style.setProperty('--toast-duration', `${duration / 1000}s`);

    let toastContainer = document.getElementById("toast-overlay");
    if (!toastContainer) {
        // Create the container if it doesn't exist (though it should from index.html)
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-overlay';
        document.body.appendChild(toastContainer);
    }
    toastContainer.appendChild(box);

    box.addEventListener('animationend', (event) => {
        if (event.animationName === 'fadeOutIndividual') {
            box.remove();
        }
    });
};

let submit = 
    document.querySelector(".custom-toast.success-toast");
let information = 
    document.querySelector(".custom-toast.info-toast");
let failed = 
    document.querySelector(".custom-toast.danger-toast");
let warn = 
    document.querySelector(".custom-toast.warning-toast");

submit.addEventListener("click",(e) => {
        e.preventDefault();
        showToast("Article Submitted Successfully","success",5000);
    });

information.addEventListener("click",(e) => {
        e.preventDefault();
        showToast("Do POTD and Earn Coins","info",5000);
    });

failed.addEventListener("click",(e) => {
        e.preventDefault();
        showToast("Failed unexpected error","danger",5000);
    });

warn.addEventListener("click",(e) => {
        e.preventDefault();
        showToast("Please be cautious!","warning",5000);
    });
