const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const timeScaleSelect = document.getElementById('timeScale');

// Viewport & Navigation State
let viewStartDay = -50;
let dayWidth = 15;
let verticalScale = 0.04;
let timeStep = 1;        // 1 = Daily, 30 = Monthly, 365 = Yearly

let isDragging = false;
let startX = 0;
let mouseX = -1;
let mouseY = -1;

// Handle Scale Change from Control Bar
timeScaleSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'daily') timeStep = 1;
    else if (val === 'monthly') timeStep = 30;
    else if (val === 'yearly') timeStep = 365;
    draw();
});

// Auto-resize canvas to fit remaining space below control bar
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    draw();
}
window.addEventListener('resize', resizeCanvas);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const middleY = height / 2;

    // Draw middle zero-axis baseline
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, middleY);
    ctx.lineTo(width, middleY);
    ctx.stroke();

    const totalVisibleColumns = Math.ceil(width / dayWidth);
    const startDay = Math.floor(viewStartDay);

    let hoveredBar = null;

    for (let i = 0; i <= totalVisibleColumns + 1; i++) {
        // Step across time based on Daily/Monthly/Yearly selection
        const day = startDay + (i * timeStep);
        const val = getValueAt(day);

        const x = ((day - viewStartDay) / timeStep) * dayWidth;
        const barWidth = Math.max(1, dayWidth - 2);
        const barHeight = Math.abs(val) * verticalScale;
        const barY = val >= 0 ? middleY - barHeight : middleY;

        // Draw bar
        if (val >= 0) {
            ctx.fillStyle = '#10b981'; // Green
        } else {
            ctx.fillStyle = '#ef4444'; // Red
        }
        ctx.fillRect(x, barY, barWidth, barHeight);

        // Check if mouse is hovering over this bar
        if (mouseX >= x && mouseX <= x + barWidth && mouseY >= 0 && mouseY <= height) {
            hoveredBar = { day, val, x, barY };
        }
    }

    // Render Hover Tooltip if hovering over a bar
    if (hoveredBar) {
        // Highlight hovered bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hoveredBar.x - 1, hoveredBar.val >= 0 ? middleY - Math.abs(hoveredBar.val) * verticalScale - 1 : middleY - 1, dayWidth, Math.abs(hoveredBar.val) * verticalScale + 2);

        // Tooltip box content
        const textDate = `Day: ${hoveredBar.day}`;
        const textVal = `Total: $${hoveredBar.val.toFixed(2)}`;

        ctx.font = '12px sans-serif';
        const boxWidth = Math.max(ctx.measureText(textDate).width, ctx.measureText(textVal).width) + 20;
        const boxHeight = 45;

        let boxX = hoveredBar.x + 15;
        let boxY = mouseY - 50;
        if (boxX + boxWidth > width) boxX = hoveredBar.x - boxWidth - 15; // Flip if near right edge

        // Draw Tooltip Background
        ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 1;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw Tooltip Text
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText(textDate, boxX + 10, boxY + 18);
        ctx.fillStyle = hoveredBar.val >= 0 ? '#10b981' : '#ef4444';
        ctx.fillText(textVal, boxX + 10, boxY + 35);
    }
}

// Mouse tracking for drag/pan and tooltips
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

canvas.addEventListener('mouseup', () => { isDragging = false; });
canvas.addEventListener('mouseleave', () => { mouseX = -1; mouseY = -1; draw(); });

const scrollModeSelect = document.getElementById('scrollMode');
let scrollMode = 'vertical'; // Default

scrollModeSelect.addEventListener('change', (e) => {
    scrollMode = e.target.value;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 1.1;

    if (scrollMode === 'horizontal') {
        // Bunch days closer or spread them out
        if (e.deltaY < 0) {
            dayWidth *= zoomIntensity; // Spread out
        } else {
            dayWidth /= zoomIntensity; // Bunch closer
        }

        // Clamp with dayWidth
        dayWidth = Math.max(2, Math.min(100, dayWidth));
    } else {
        // Zoom bar height
        if (e.deltaY < 0) {
            verticalScale *= zoomIntensity;
        } else {
            verticalScale /= zoomIntensity;
        }

        verticalScale = Math.max(0.001, Math.min(5.0, verticalScale));
    }

    draw();
}, { passive: false });

// Main

resizeCanvas();
