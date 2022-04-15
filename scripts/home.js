
const moreInformationButton = document.querySelector(".more-information-button");
moreInformationButton.addEventListener("click", () => {
    alert(`
    Created by: ${ownerName}
    Email: ${ownerEmail}
    Created on: Early 2022`);
});

const darkBackground = document.querySelector(".dark-background");
const navButtonGroup = document.querySelector(".nav-button-header");
const hamburgerIcon = document.querySelector(".hamburger-icon");

document.addEventListener("click", () => {
    if (navButtonGroup.classList.contains("nav-button-dialog")) {
        darkBackground.classList.add("hidden");
        navButtonGroup.setAttribute("class", "nav-button-header");
    }
});

hamburgerIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    if (navButtonGroup.classList.contains("nav-button-header")) {
        darkBackground.classList.remove("hidden");
        navButtonGroup.setAttribute("class", "nav-button-dialog");
    } else {
        darkBackground.classList.add("hidden");
        navButtonGroup.setAttribute("class", "nav-button-header");
    }
});

const nameInput = document.querySelector(".name-input");
const platformSelect = document.querySelector(".platform-select");
const goButton = document.querySelector(".go-button");

const updateGoLink = () => {
    goButton.href = `${platformSelect.value}/${nameInput.value}`;
}

platformSelect.addEventListener("change", () => {
    updateGoLink();
    localStorage.setItem("platform", platformSelect.value);
});

nameInput.addEventListener("input", updateGoLink);
nameInput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        goButton.click();
    }
});

for (let  i = 0; i < platformSelect.length; i++) {
    if (platformSelect.options[i].value === localStorage.getItem("platform")) {
        platformSelect.selectedIndex = i;
        break;
    }
}