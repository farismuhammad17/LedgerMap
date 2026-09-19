const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const timeScaleSelect = document.getElementById('timeScale');
const scrollModeSelect = document.getElementById('scrollMode');

let viewStartDay = -50;
let dayWidth = 15;
let verticalScale = 0.04;
let timeStep = 1;
let scrollMode = 'vertical';

let isDragging = false;
let startX = 0;
let mouseX = -1;
let mouseY = -1;

resizeCanvas();

// Event Listeners

window.addEventListener('resize', resizeCanvas);

timeScaleSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'daily') timeStep = 1;
    else if (val === 'monthly') timeStep = 30;
    else if (val === 'yearly') timeStep = 365;
    draw();
});

scrollModeSelect.addEventListener('change', (e) => {
    scrollMode = e.target.value;
});

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (isDragging) {
        const dx = e.clientX - startX;
        startX = e.clientX;
        viewStartDay -= (dx / dayWidth) * timeStep;
    }
    draw();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    mouseX = -1;
    mouseY = -1;
    draw();
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 1.1;

    if (scrollMode === 'horizontal') {
        if (e.deltaY < 0) {
            dayWidth *= zoomIntensity;
        } else {
            dayWidth /= zoomIntensity;
        }
        dayWidth = Math.max(2, Math.min(100, dayWidth));
    } else {
        if (e.deltaY < 0) {
            verticalScale *= zoomIntensity;
        } else {
            verticalScale /= zoomIntensity;
        }
        verticalScale = Math.max(0.001, Math.min(5.0, verticalScale));
    }

    draw();
}, { passive: false });

// Core Functions

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const middleY = height / 2;

    drawBaseline(width, middleY);

    const totalVisibleColumns = Math.ceil(width / dayWidth);
    const startDay = Math.floor(viewStartDay);
    let hoveredBar = null;

    for (let i = 0; i <= totalVisibleColumns + 1; i++) {
        const day = startDay + (i * timeStep);
        const val = getValueAt(day);

        const x = ((day - viewStartDay) / timeStep) * dayWidth;
        const barWidth = Math.max(1, dayWidth - 2);
        const barHeight = Math.abs(val) * verticalScale;
        const barY = val >= 0 ? middleY - barHeight : middleY;

        ctx.fillStyle = val >= 0 ? '#10b981' : '#ef4444';
        ctx.fillRect(x, barY, barWidth, barHeight);

        if (mouseX >= x && mouseX <= x + barWidth && mouseY >= 0 && mouseY <= height) {
            hoveredBar = { day, val, x, barY };
        }
    }

    if (hoveredBar) {
        drawTooltip(hoveredBar, middleY, width, height);
    }
}

function drawBaseline(width, middleY) {
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, middleY);
    ctx.lineTo(width, middleY);
    ctx.stroke();
}

function drawTooltip(hoveredBar, middleY, width, height) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
        hoveredBar.x - 1,
        hoveredBar.val >= 0 ? middleY - Math.abs(hoveredBar.val) * verticalScale - 1 : middleY - 1,
        dayWidth,
        Math.abs(hoveredBar.val) * verticalScale + 2
    );

    const textDate = `Day: ${hoveredBar.day}`;
    const textVal = `Total: ${hoveredBar.val.toFixed(2)}`;

    ctx.font = '12px sans-serif';
    const boxWidth = Math.max(ctx.measureText(textDate).width, ctx.measureText(textVal).width) + 20;
    const boxHeight = 45;

    let boxX = hoveredBar.x + 15;
    let boxY = mouseY - 50;
    if (boxX + boxWidth > width) boxX = hoveredBar.x - boxWidth - 15;

    ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(textDate, boxX + 10, boxY + 18);
    ctx.fillStyle = hoveredBar.val >= 0 ? '#10b981' : '#ef4444';
    ctx.fillText(textVal, boxX + 10, boxY + 35);
}
