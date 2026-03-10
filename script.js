const spotlight = document.querySelector('.spotlight');

document.addEventListener('mousemove', e => {
  spotlight.style.left = `${e.clientX}px`;
  spotlight.style.top = `${e.clientY}px`;
  spotlight.style.opacity = 1;
});

document.addEventListener('mouseleave', e => {
  spotlight.style.opacity = 0;
});