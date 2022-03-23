const loader = document.querySelector('.loader-wrapper');
const content = document.querySelector('.content');
const elbody = document.getElementsByTagName('body');
window.addEventListener('load', function() {
    this.setTimeout(() => {
        loader.style.display = "none";
        content.classList.add('show');
        document.body.classList.remove('noscroll');
        document.body.style.maxHeight = "none";
    }, 3000)
});

let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);

function changeVisible() {


    let element = document.getElementById('welcome');
    var top_of_screen = window.scrollY;

    if (top_of_screen > window.innerHeight * 1.3) {
        element.style.display = "none";
    } else {
        element.style.display = "block";
    }


    let sectionList = document.querySelectorAll(".hidden");
    sectionList.forEach(function(section) {
        if (isVisible(section)) {
            section.classList.remove("hidden");
        } else {
            section.classList.add("hidden");
        }
    });
};

function isVisible(el) {
    let elBox = el.getBoundingClientRect();
    let dist = -100;

    if (elBox.top - window.innerHeight < dist) {
        return true;
    } else {
        return false;
    }
}

document.addEventListener("scroll", ttr(changeVisible, 100));
changeVisible();

function ttr(func, time) {
    var total = Date.now();
    return function() {
        if ((total + time - Date.now()) < 0) {
            func();
            total = Date.now();
        }
    }
}

window.addEventListener('resize', () => {
    // We execute the same script as before
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});