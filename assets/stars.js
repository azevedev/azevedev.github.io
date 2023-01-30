const canvas1 = document.getElementById("up_canvas");
const canvas2 = document.getElementById("bottom_canvas");

// put the canvas in the center of the screen
let wi = window.innerWidth;
let hi = window.innerHeight;
console.log(wi);
console.log(hi);
// canvas1.style.left = (wi - canvas1.width) / 2 + "px";
// canvas1.style.top = (hi - canvas1.height) / 2 + "px";

// make canvas fit the window
canvas1.width = wi
canvas1.height = hi;



const mercury = {
    el: document.getElementById('mercury'),
    speed: 0.03,
    angle: 0,
    radius: 200,
    offX: -10,
    offY: -10,
}

const venus = {
    el: document.getElementById('venus'),
    speed: 0.01,
    angle: 0,
    radius: 300,
    offX: -10,
    offY: -10,
}

const earth = {
    el: document.getElementById('earth'),
    speed: -0.02,
    angle: 0,
    radius: 450,
    offX: -10,
    offY: -10,
}

function updatePlanet(planet) {
    planet.angle += planet.speed;
    planet.el.style.left = (Math.cos(planet.angle) * planet.radius + wi / 2 + planet.offX) + "px";
    planet.el.style.top = (Math.sin(planet.angle) * planet.radius + hi / 2 + planet.offY) + "px";
}
setInterval(() => {
    updatePlanet(mercury);
    updatePlanet(venus);
    updatePlanet(earth);
}, 10)



const ctx1 = canvas1.getContext("2d");

ctx1.translate(canvas1.width / 2, canvas1.height / 2);


// change canvas width and height to fit the window when the window is resized
window.addEventListener('resize', () => {
    // We execute the same script as before
    wi = window.innerWidth;
    hi = window.innerHeight;
    canvas1.width = wi
    canvas1.height = hi;
    ctx1.translate(canvas1.width / 2, canvas1.height / 2);
});


class Star {

    constructor(x, y, radius, color, ctx) {
        this.x = x;
        this.y = y;
        this.z = wi / 4;
        this.radius = radius;
        this.color = color;
        this.ctx = ctx;
        this.speed = Math.random() * 3 + 8;
    }

    draw() {
        this.ctx.beginPath();
        this.radius = this.radius + Math.random() * 2 - 1;
        if (this.radius < 1.5)
            this.radius = Math.random() * 2 + 8;
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    update() {
        // this.z -= this.speed; // Move star closer to viewport
        // if (this.z <= 1) { // Reset star if it passes viewport
        //     this.z = wi / 2 - Math.random() * wi / 2;
        //     this.x = Math.random() * canvas1.width - canvas1.width / 2;
        //     this.y = Math.random() * canvas1.height - canvas1.height / 2;
        //     this.speed = Math.random() * 3 + 8;
        // }
        this.draw();

    }

}

const stars = [];

// make 100 random stars
for (let i = 0; i < 1000; i++) {
    let radius = Math.random() * 2 + 8;
    let x = Math.random() * canvas1.width - canvas1.width / 2;
    let y = Math.random() * canvas1.height - canvas1.height / 2;
    let color = `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.8})`;
    stars.push(new Star(x, y, radius, color, ctx1));
}


let a = 0;

function animate() {
    requestAnimationFrame(animate);
    ctx1.clearRect(-canvas1.width / 2, -canvas1.height / 2, canvas1.width * 2, canvas1.height * 2);
    // ctx1.rotate(a * Math.PI / 180);
    for (let i = 0; i < stars.length; i++) {
        stars[i].update();
    }
    a += 0.004;

}

// animate();