const spotlight = document.querySelector('.spotlight');

document.addEventListener('mousemove', e => {
  spotlight.style.left = `${e.clientX}px`;
  spotlight.style.top = `${e.clientY}px`;
  spotlight.style.opacity = 1;
});

document.addEventListener('mouseleave', e => {
  spotlight.style.opacity = 0;
});

function toggleAbout() {
  const box = document.getElementById("aboutBox");

  if (box.style.display === "block") {
    box.style.display = "none";
  } else {
    box.style.display = "block";
  }
}

// Parallax effect for water background
const water = document.querySelector('.water-bg');

document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20; // horizontal offset
  const y = (e.clientY / window.innerHeight - 0.5) * 20; // vertical offset

  water.style.transform = `translate(${x}px, ${y}px)`;
});