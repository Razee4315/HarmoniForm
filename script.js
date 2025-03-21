// Get DOM elements
const canvas = document.getElementById('pattern-canvas');
const ctx = canvas.getContext('2d');

// Get control elements
const sidesInput = document.getElementById('sides');
const sidesValue = document.getElementById('sides-value');
const radiusInput = document.getElementById('radius');
const radiusValue = document.getElementById('radius-value');
const angleInput = document.getElementById('angle');
const angleValue = document.getElementById('angle-value');
const rotationInput = document.getElementById('rotation');
const rotationValue = document.getElementById('rotation-value');
const waveTypeSelect = document.getElementById('wave-type');
const frequencyInput = document.getElementById('frequency');
const frequencyValue = document.getElementById('frequency-value');
const amplitudeInput = document.getElementById('amplitude');
const amplitudeValue = document.getElementById('amplitude-value');
const phaseInput = document.getElementById('phase');
const phaseValue = document.getElementById('phase-value');
const enableSecondaryToggle = document.getElementById('enable-secondary');
const secondaryControls = document.getElementById('secondary-controls');
const secondaryWaveTypeSelect = document.getElementById('secondary-wave-type');
const secondaryFrequencyInput = document.getElementById('secondary-frequency');
const secondaryFrequencyValue = document.getElementById('secondary-frequency-value');
const secondaryAmplitudeInput = document.getElementById('secondary-amplitude');
const secondaryAmplitudeValue = document.getElementById('secondary-amplitude-value');
const secondaryPhaseInput = document.getElementById('secondary-phase');
const secondaryPhaseValue = document.getElementById('secondary-phase-value');
const waveCombinationSelect = document.getElementById('wave-combination');

const strokeColorInput = document.getElementById('stroke-color');
const fillColorInput = document.getElementById('fill-color');
const fillOpacityInput = document.getElementById('fill-opacity');
const fillOpacityValue = document.getElementById('fill-opacity-value');
const lineWidthInput = document.getElementById('line-width');
const lineWidthValue = document.getElementById('line-width-value');
const colorModeSelect = document.getElementById('color-mode');

const animationToggle = document.getElementById('animation-toggle');
const animationSpeedInput = document.getElementById('animation-speed');
const animationSpeedValue = document.getElementById('animation-speed-value');
const animationTargetSelect = document.getElementById('animation-target');

const exportBtn = document.getElementById('export-btn');
const savePresetBtn = document.getElementById('save-preset-btn');
const presetButtons = document.querySelectorAll('.preset');
const formulaText = document.getElementById('formula-text');
const advancedFormula = document.getElementById('advanced-formula');

const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close-btn');
const savePresetConfirmBtn = document.getElementById('save-preset-confirm');
const presetNameInput = document.getElementById('preset-name');

// Get DOM elements for export options
const exportSvgBtn = document.getElementById('export-svg-btn');
const exportVideoBtn = document.getElementById('export-video-btn');
const videoExportOptions = document.querySelector('.video-export-options');
const videoDurationInput = document.getElementById('video-duration');
const videoDurationValue = document.getElementById('video-duration-value');
const videoFpsInput = document.getElementById('video-fps');
const videoFpsValue = document.getElementById('video-fps-value');
const videoQualityInput = document.getElementById('video-quality');
const videoQualityValue = document.getElementById('video-quality-value');

// Pattern parameters
let params = {
    sides: 6,
    radius: 150,
    angleIncrement: 30,
    baseRotation: 0,
    waveType: 'sin',
    frequency: 1,
    amplitude: 30,
    phase: 0,
    enableSecondary: false,
    secondaryWaveType: 'cos',
    secondaryFrequency: 2,
    secondaryAmplitude: 15,
    secondaryPhase: Math.PI/2,
    waveCombination: 'add',
    strokeColor: '#3498db',
    fillColor: '#ffffff',
    fillOpacity: 0.2,
    lineWidth: 2,
    colorMode: 'solid',
    animationSpeed: 1,
    animationTarget: 'phase'
};

// Animation variables
let animationId = null;
let animationTime = 0;

// Video export settings
let videoExportSettings = {
    duration: 5,
    fps: 30,
    quality: 2 // 1 = low, 2 = medium, 3 = high
};

// User saved presets
let userPresets = JSON.parse(localStorage.getItem('userPresets')) || {};

// Initialize canvas size
function setupCanvas() {
    // Set the canvas to be a square with the correct pixel density
    const containerWidth = canvas.parentElement.clientWidth;
    const size = Math.min(containerWidth, 600);
    
    // Set display size (css pixels)
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    
    // Set actual size in memory (scaled for high DPI)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    
    // Scale the context to ensure correct drawing operations
    ctx.scale(dpr, dpr);
    
    // Set the origin to the center of the canvas
    ctx.translate(size / 2, size / 2);
}

// Wave function implementations
const waveFunctions = {
    sin: (x) => Math.sin(x),
    cos: (x) => Math.cos(x),
    tan: (x) => {
        // Limit tangent to avoid extreme values
        const tanVal = Math.tan(x);
        return Math.max(-10, Math.min(10, tanVal));
    },
    square: (x) => Math.sin(x) >= 0 ? 1 : -1,
    sawtooth: (x) => (x % (2 * Math.PI)) / Math.PI - 1,
    triangle: (x) => {
        const t = (x % (2 * Math.PI)) / Math.PI;
        return t < 1 ? 2 * t - 1 : 3 - 2 * t;
    }
};

// Combine wave functions
function combineWaves(primary, secondary, method) {
    switch (method) {
        case 'add':
            return primary + secondary;
        case 'multiply':
            return primary * secondary;
        case 'max':
            return Math.max(primary, secondary);
        case 'min':
            return Math.min(primary, secondary);
        default:
            return primary + secondary;
    }
}

// Calculate wave effect based on parameters
function calculateWaveEffect(angle, params, time = 0) {
    const { 
        sides, waveType, frequency, amplitude, phase,
        enableSecondary, secondaryWaveType, secondaryFrequency, 
        secondaryAmplitude, secondaryPhase, waveCombination,
        animationTarget
    } = params;
    
    // Calculate dynamic parameters if animation is on
    let currentPhase = phase;
    let currentFrequency = frequency;
    let currentAmplitude = amplitude;
    let secondaryCurrentPhase = secondaryPhase;
    
    if (animationToggle.checked) {
        const animSpeed = params.animationSpeed * 0.001;
        
        if (animationTarget === 'phase' || animationTarget === 'multiple') {
            currentPhase = phase + time * animSpeed;
            if (enableSecondary) {
                secondaryCurrentPhase = secondaryPhase + time * animSpeed * 1.5;
            }
        }
        
        if (animationTarget === 'frequency' || animationTarget === 'multiple') {
            currentFrequency = frequency + Math.sin(time * animSpeed * 0.2) * (frequency * 0.5);
        }
        
        if (animationTarget === 'amplitude' || animationTarget === 'multiple') {
            currentAmplitude = amplitude + Math.sin(time * animSpeed * 0.1) * (amplitude * 0.3);
        }
    }
    
    // Calculate primary wave
    const waveAngle = angle * sides;
    const primaryWave = currentAmplitude * waveFunctions[waveType](currentFrequency * waveAngle + currentPhase);
    
    // Calculate secondary wave if enabled
    if (enableSecondary) {
        const secondaryWave = secondaryAmplitude * 
            waveFunctions[secondaryWaveType](secondaryFrequency * waveAngle + secondaryCurrentPhase);
        
        // Combine waves
        return combineWaves(primaryWave, secondaryWave, waveCombination);
    }
    
    return primaryWave;
}

// Generate color based on angle and color mode
function getColor(angle, isStroke = true) {
    const { strokeColor, fillColor, colorMode } = params;
    
    if (colorMode === 'solid' || (isStroke && colorMode === 'gradient')) {
        return isStroke ? strokeColor : fillColor;
    }
    
    if (colorMode === 'gradient' && !isStroke) {
        // Create a gradient from center to edge
        const canvasSize = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, canvasSize / 2);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, strokeColor);
        return gradient;
    }
    
    if (colorMode === 'rainbow') {
        // Create rainbow colors based on angle
        const hue = ((angle * 180 / Math.PI) + 180) % 360;
        return `hsl(${hue}, 80%, ${isStroke ? 50 : 70}%)`;
    }
    
    return isStroke ? strokeColor : fillColor;
}

// Draw the pattern based on current parameters
function drawPattern(time = 0) {
    const { 
        radius, angleIncrement, baseRotation, 
        fillOpacity, lineWidth, animationTarget
    } = params;
    
    const canvasSize = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
    
    // Clear the canvas
    ctx.clearRect(-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize);
    
    // Calculate dynamic rotation if animation is on
    let currentRotation = baseRotation * Math.PI / 180;
    if (animationToggle.checked && animationTarget === 'rotation') {
        currentRotation = baseRotation * Math.PI / 180 + time * params.animationSpeed * 0.0005;
    }
    
    // Draw the pattern
    ctx.beginPath();
    
    // Calculate points based on wave modulation
    const points = [];
    for (let i = 0; i <= 360; i += 1) {
        const angle = (i * Math.PI) / 180;
        const waveEffect = calculateWaveEffect(angle, params, time);
        const r = radius + waveEffect;
        
        const x = r * Math.cos(angle + currentRotation);
        const y = r * Math.sin(angle + currentRotation);
        
        points.push({ x, y });
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.closePath();
    
    // Style and fill the pattern
    if (params.fillOpacity > 0) {
        ctx.fillStyle = getColor(0, false);
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    // Stroke the pattern
    ctx.strokeStyle = getColor(0, true);
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Draw inner lines for more complex patterns
    if (angleIncrement > 0 && angleIncrement < 360) {
        for (let i = 0; i < 360; i += angleIncrement) {
            const angle = (i * Math.PI) / 180;
            
            // Draw lines from center to points on the pattern
            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            const waveEffect = calculateWaveEffect(angle, params, time);
            const r = radius + waveEffect;
            
            const x = r * Math.cos(angle + currentRotation);
            const y = r * Math.sin(angle + currentRotation);
            
            ctx.lineTo(x, y);
            
            if (params.colorMode === 'rainbow') {
                ctx.strokeStyle = getColor(angle, true);
            } else {
                ctx.strokeStyle = params.strokeColor + '80'; // Add 50% transparency
            }
            
            ctx.lineWidth = lineWidth * 0.5;
            ctx.stroke();
        }
    }
    
    // Update formula display
    updateFormulaDisplay();
}

// Update the formula display based on current parameters
function updateFormulaDisplay() {
    const { 
        waveType, frequency, amplitude, phase,
        enableSecondary, secondaryWaveType, secondaryFrequency, 
        secondaryAmplitude, secondaryPhase, waveCombination
    } = params;
    
    // Format the primary wave formula
    let formula = `r = baseRadius + ${amplitude} * ${waveType}(${frequency} * θ`;
    if (phase !== 0) {
        const phaseSign = phase > 0 ? ' + ' : ' - ';
        formula += `${phaseSign}${Math.abs(phase).toFixed(2)}`;
    }
    formula += ')';
    
    // Add secondary wave formula if enabled
    if (enableSecondary) {
        let secondaryFormula = `${secondaryAmplitude} * ${secondaryWaveType}(${secondaryFrequency} * θ`;
        if (secondaryPhase !== 0) {
            const phaseSign = secondaryPhase > 0 ? ' + ' : ' - ';
            secondaryFormula += `${phaseSign}${Math.abs(secondaryPhase).toFixed(2)}`;
        }
        secondaryFormula += ')';
        
        // Combine formulas based on combination method
        switch (waveCombination) {
            case 'add':
                formula = `r = baseRadius + ${amplitude} * ${waveType}(${frequency} * θ${phase !== 0 ? ` ${phase > 0 ? '+' : '-'} ${Math.abs(phase).toFixed(2)}` : ''}) + ${secondaryFormula}`;
                break;
            case 'multiply':
                formula = `r = baseRadius + ${amplitude} * ${waveType}(${frequency} * θ${phase !== 0 ? ` ${phase > 0 ? '+' : '-'} ${Math.abs(phase).toFixed(2)}` : ''}) * ${secondaryFormula}`;
                break;
            case 'max':
                formula = `r = baseRadius + max(${amplitude} * ${waveType}(${frequency} * θ${phase !== 0 ? ` ${phase > 0 ? '+' : '-'} ${Math.abs(phase).toFixed(2)}` : ''}), ${secondaryFormula})`;
                break;
            case 'min':
                formula = `r = baseRadius + min(${amplitude} * ${waveType}(${frequency} * θ${phase !== 0 ? ` ${phase > 0 ? '+' : '-'} ${Math.abs(phase).toFixed(2)}` : ''}), ${secondaryFormula})`;
                break;
        }
        
        // Add detailed explanation to advanced formula section
        advancedFormula.innerHTML = `
            <p>Primary Wave: ${amplitude} * ${waveType}(${frequency} * θ${phase !== 0 ? ` ${phase > 0 ? '+' : '-'} ${Math.abs(phase).toFixed(2)}` : ''})</p>
            <p>Secondary Wave: ${secondaryFormula}</p>
            <p>Combination Method: ${waveCombination}</p>
        `;
    } else {
        advancedFormula.innerHTML = '';
    }
    
    formulaText.textContent = formula;
}

// Animation loop
function animate() {
    animationTime += 16; // Approximately 60fps
    drawPattern(animationTime);
    animationId = requestAnimationFrame(animate);
}

// Start or stop animation
function toggleAnimation() {
    if (animationToggle.checked) {
        animationSpeedInput.disabled = false;
        animate();
    } else {
        animationSpeedInput.disabled = true;
        cancelAnimationFrame(animationId);
        drawPattern();
    }
}

// Export the pattern as PNG
function exportPNG() {
    // Create a temporary canvas to draw the full image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set the size of the temporary canvas
    const size = Math.min(canvas.width, canvas.height);
    tempCanvas.width = size;
    tempCanvas.height = size;
    
    // Copy the current canvas to the temporary canvas
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, size, size);
    tempCtx.drawImage(canvas, 0, 0);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.download = 'waveform-pattern.png';
    
    // Convert canvas to data URL
    link.href = tempCanvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export the pattern as SVG
function exportSVG() {
    // Create SVG namespace
    const svgNS = "http://www.w3.org/2000/svg";
    
    // Create SVG element
    const svg = document.createElementNS(svgNS, "svg");
    const size = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    
    // Create a background rectangle
    const background = document.createElementNS(svgNS, "rect");
    background.setAttribute("width", size);
    background.setAttribute("height", size);
    background.setAttribute("fill", "#ffffff");
    svg.appendChild(background);
    
    // Calculate center point
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Create the main pattern path
    const path = document.createElementNS(svgNS, "path");
    let pathData = `M`;
    
    // Calculate points based on current parameters
    for (let i = 0; i <= 360; i += 1) {
        const angle = (i * Math.PI) / 180;
        const waveEffect = calculateWaveEffect(angle, params);
        const r = params.radius + waveEffect;
        
        const currentRotation = params.baseRotation * Math.PI / 180;
        const x = centerX + r * Math.cos(angle + currentRotation);
        const y = centerY + r * Math.sin(angle + currentRotation);
        
        if (i === 0) {
            pathData += `${x},${y}`;
        } else {
            pathData += ` L${x},${y}`;
        }
    }
    
    pathData += " Z"; // Close the path
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", params.strokeColor);
    path.setAttribute("stroke-width", params.lineWidth);
    path.setAttribute("fill", params.fillColor);
    path.setAttribute("fill-opacity", params.fillOpacity);
    svg.appendChild(path);
    
    // Add inner lines if needed
    if (params.angleIncrement > 0 && params.angleIncrement < 360) {
        for (let i = 0; i < 360; i += params.angleIncrement) {
            const angle = (i * Math.PI) / 180;
            
            // Calculate wave effect for this angle
            const waveEffect = calculateWaveEffect(angle, params);
            const r = params.radius + waveEffect;
            
            const currentRotation = params.baseRotation * Math.PI / 180;
            const x = centerX + r * Math.cos(angle + currentRotation);
            const y = centerY + r * Math.sin(angle + currentRotation);
            
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", centerX);
            line.setAttribute("y1", centerY);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", params.strokeColor);
            line.setAttribute("stroke-width", params.lineWidth * 0.5);
            line.setAttribute("stroke-opacity", "0.5");
            svg.appendChild(line);
        }
    }
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.download = 'waveform-pattern.svg';
    link.href = svgUrl;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(svgUrl);
}

// Export the pattern as a video
function exportVideo() {
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Generating video...</p>';
    document.body.appendChild(loadingIndicator);
    
    const duration = videoExportSettings.duration;
    const fps = videoExportSettings.fps;
    const totalFrames = duration * fps;
    const quality = videoExportSettings.quality;
    
    // Create a temporary canvas for the video frames with higher resolution
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set the size of the temporary canvas (higher resolution for better quality)
    const size = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
    const scale = quality === 1 ? 1 : (quality === 2 ? 2 : 3); // Scale based on quality setting
    tempCanvas.width = size * scale;
    tempCanvas.height = size * scale;
    
    // Create a MediaRecorder to record the canvas
    const stream = tempCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: quality === 1 ? 2500000 : (quality === 2 ? 5000000 : 8000000) // Bitrate based on quality
    });
    
    // Array to store the recorded chunks
    const chunks = [];
    
    // Event listener for data available
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    
    // Event listener for recording stop
    recorder.onstop = () => {
        // Create a blob from the chunks
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.download = 'waveform-pattern.webm';
        link.href = url;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        // Remove loading indicator
        document.body.removeChild(loadingIndicator);
    };
    
    // Start recording
    recorder.start();
    
    // Variables for animation
    let frameCount = 0;
    const frameTime = 1000 / fps;
    
    // Store original animation state
    const originalAnimationState = animationToggle.checked;
    const originalAnimationTarget = params.animationTarget;
    const originalAnimationSpeed = params.animationSpeed;
    
    // Force animation on for video
    if (!originalAnimationState) {
        animationToggle.checked = true;
    }
    
    // Set animation targets for video to ensure movement
    params.animationTarget = 'multiple';
    params.animationSpeed = 50; // Set a reasonable animation speed
    
    // Animation function for recording frames
    function drawFrame() {
        if (frameCount >= totalFrames) {
            // Restore original animation state
            animationToggle.checked = originalAnimationState;
            params.animationTarget = originalAnimationTarget;
            params.animationSpeed = originalAnimationSpeed;
            
            recorder.stop();
            return;
        }
        
        // Clear the temporary canvas
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Calculate the current time for the animation
        const progress = frameCount / totalFrames;
        const animTime = progress * duration * 1000;
        
        // Save the current context state
        tempCtx.save();
        
        // Scale for higher resolution
        tempCtx.scale(scale, scale);
        
        // Translate to center
        tempCtx.translate(size / 2, size / 2);
        
        // Draw the pattern with the current animation time
        drawPatternToContext(tempCtx, animTime);
        
        // Restore the context state
        tempCtx.restore();
        
        // Increment frame count
        frameCount++;
        
        // Schedule the next frame
        setTimeout(drawFrame, frameTime);
    }
    
    // Start drawing frames
    drawFrame();
}

// Draw pattern to a specific context (for video export)
function drawPatternToContext(context, time = 0) {
    const { 
        sides, radius, angleIncrement, baseRotation, 
        waveType, frequency, amplitude, phase,
        enableSecondary, secondaryWaveType, secondaryFrequency, 
        secondaryAmplitude, secondaryPhase, waveCombination,
        fillOpacity, lineWidth, colorMode, animationTarget
    } = params;
    
    const canvasSize = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
    
    // Calculate dynamic parameters for animation
    let currentPhase = phase;
    let currentFrequency = frequency;
    let currentAmplitude = amplitude;
    let secondaryCurrentPhase = secondaryPhase;
    let currentRotation = baseRotation * Math.PI / 180;
    
    // Apply animation effects based on time
    const animSpeed = params.animationSpeed * 0.001;
    
    // Always animate phase for video export to ensure movement
    currentPhase = phase + time * animSpeed;
    if (enableSecondary) {
        secondaryCurrentPhase = secondaryPhase + time * animSpeed * 1.5;
    }
    
    // Add additional animation effects if specified
    if (animationTarget === 'rotation' || animationTarget === 'multiple') {
        currentRotation = baseRotation * Math.PI / 180 + time * animSpeed * 0.0005;
    }
    
    if (animationTarget === 'frequency' || animationTarget === 'multiple') {
        currentFrequency = frequency + Math.sin(time * animSpeed * 0.2) * (frequency * 0.5);
    }
    
    if (animationTarget === 'amplitude' || animationTarget === 'multiple') {
        currentAmplitude = amplitude + Math.sin(time * animSpeed * 0.1) * (amplitude * 0.3);
    }
    
    // Draw the pattern
    context.beginPath();
    
    // Calculate points based on wave modulation
    for (let i = 0; i <= 360; i += 1) {
        const angle = (i * Math.PI) / 180;
        
        // Calculate wave effect with animation time
        const waveAngle = angle * sides;
        
        // Calculate primary wave
        const primaryWave = currentAmplitude * waveFunctions[waveType](currentFrequency * waveAngle + currentPhase);
        
        // Calculate final wave effect
        let waveEffect = primaryWave;
        
        // Calculate secondary wave if enabled
        if (enableSecondary) {
            const secondaryWave = secondaryAmplitude * 
                waveFunctions[secondaryWaveType](secondaryFrequency * waveAngle + secondaryCurrentPhase);
            
            // Combine waves
            waveEffect = combineWaves(primaryWave, secondaryWave, waveCombination);
        }
        
        const r = radius + waveEffect;
        
        const x = r * Math.cos(angle + currentRotation);
        const y = r * Math.sin(angle + currentRotation);
        
        if (i === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    }
    
    context.closePath();
    
    // Style and fill the pattern
    if (fillOpacity > 0) {
        if (colorMode === 'gradient') {
            // Create a gradient from center to edge
            const gradient = context.createRadialGradient(0, 0, 0, 0, 0, canvasSize / 2);
            gradient.addColorStop(0, params.fillColor);
            gradient.addColorStop(1, params.strokeColor);
            context.fillStyle = gradient;
        } else if (colorMode === 'rainbow') {
            context.fillStyle = `hsla(${(time * 0.05) % 360}, 80%, 70%, ${fillOpacity})`;
        } else {
            context.fillStyle = params.fillColor;
        }
        
        context.globalAlpha = fillOpacity;
        context.fill();
        context.globalAlpha = 1;
    }
    
    // Stroke the pattern
    if (colorMode === 'rainbow') {
        context.strokeStyle = `hsl(${(time * 0.05) % 360}, 80%, 50%)`;
    } else {
        context.strokeStyle = params.strokeColor;
    }
    
    context.lineWidth = lineWidth;
    context.stroke();
    
    // Draw inner lines for more complex patterns
    if (angleIncrement > 0 && angleIncrement < 360) {
        for (let i = 0; i < 360; i += angleIncrement) {
            const angle = (i * Math.PI) / 180;
            
            // Calculate wave effect for this angle
            const waveAngle = angle * sides;
            let waveEffect = currentAmplitude * waveFunctions[waveType](currentFrequency * waveAngle + currentPhase);
            
            if (enableSecondary) {
                const secondaryWave = secondaryAmplitude * 
                    waveFunctions[secondaryWaveType](secondaryFrequency * waveAngle + secondaryCurrentPhase);
                waveEffect = combineWaves(waveEffect, secondaryWave, waveCombination);
            }
            
            const r = radius + waveEffect;
            
            const x = r * Math.cos(angle + currentRotation);
            const y = r * Math.sin(angle + currentRotation);
            
            // Draw lines from center to points on the pattern
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(x, y);
            
            if (colorMode === 'rainbow') {
                const hue = ((angle * 180 / Math.PI) + (time * 0.05)) % 360;
                context.strokeStyle = `hsla(${hue}, 80%, 50%, 0.5)`;
            } else {
                context.strokeStyle = params.strokeColor + '80'; // Add 50% transparency
            }
            
            context.lineWidth = lineWidth * 0.5;
            context.stroke();
        }
    }
}

// Update all display elements
function updateDisplay() {
    // Update value displays
    sidesValue.textContent = params.sides;
    radiusValue.textContent = params.radius;
    angleValue.textContent = params.angleIncrement;
    rotationValue.textContent = params.baseRotation;
    frequencyValue.textContent = params.frequency;
    amplitudeValue.textContent = params.amplitude;
    phaseValue.textContent = params.phase.toFixed(2);
    secondaryFrequencyValue.textContent = params.secondaryFrequency;
    secondaryAmplitudeValue.textContent = params.secondaryAmplitude;
    secondaryPhaseValue.textContent = params.secondaryPhase.toFixed(2);
    
    // Update input values to match params
    sidesInput.value = params.sides;
    radiusInput.value = params.radius;
    angleInput.value = params.angleIncrement;
    rotationInput.value = params.baseRotation;
    waveTypeSelect.value = params.waveType;
    frequencyInput.value = params.frequency;
    amplitudeInput.value = params.amplitude;
    phaseInput.value = params.phase;
    
    enableSecondaryToggle.checked = params.enableSecondary;
    secondaryControls.style.display = params.enableSecondary ? 'block' : 'none';
    secondaryWaveTypeSelect.value = params.secondaryWaveType;
    secondaryFrequencyInput.value = params.secondaryFrequency;
    secondaryAmplitudeInput.value = params.secondaryAmplitude;
    secondaryPhaseInput.value = params.secondaryPhase;
    waveCombinationSelect.value = params.waveCombination;
    
    strokeColorInput.value = params.strokeColor;
    fillColorInput.value = params.fillColor;
    fillOpacityInput.value = params.fillOpacity;
    fillOpacityValue.textContent = params.fillOpacity.toFixed(2);
    lineWidthInput.value = params.lineWidth;
    lineWidthValue.textContent = params.lineWidth;
    colorModeSelect.value = params.colorMode;
    
    animationSpeedInput.value = params.animationSpeed;
    animationSpeedValue.textContent = params.animationSpeed;
    animationTargetSelect.value = params.animationTarget;
    
    // Redraw the pattern
    drawPattern();
}

// Load a preset
function loadPreset(presetParams) {
    // Update params with preset values
    Object.assign(params, presetParams);
    
    // Update UI to match new params
    updateDisplay();
}

// Save a user preset
function saveUserPreset() {
    const presetName = presetNameInput.value.trim();
    
    if (presetName) {
        // Create a deep copy of the current params
        userPresets[presetName] = JSON.parse(JSON.stringify(params));
        
        // Save to local storage
        localStorage.setItem('userPresets', JSON.stringify(userPresets));
        
        // Close the modal
        modal.style.display = 'none';
        
        // Add the new preset to the UI
        addUserPresetToUI(presetName);
    }
}

// Add a user preset button to the UI
function addUserPresetToUI(presetName) {
    const presetContainer = document.querySelector('.user-presets');
    
    // Create a new preset button
    const presetButton = document.createElement('button');
    presetButton.classList.add('preset', 'user-preset');
    presetButton.textContent = presetName;
    
    // Add click event to load the preset
    presetButton.addEventListener('click', () => {
        loadPreset(userPresets[presetName]);
    });
    
    // Add delete button
    const deleteButton = document.createElement('span');
    deleteButton.classList.add('delete-preset');
    deleteButton.innerHTML = '&times;';
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove preset from storage
        delete userPresets[presetName];
        localStorage.setItem('userPresets', JSON.stringify(userPresets));
        
        // Remove button from UI
        presetContainer.removeChild(presetButton);
    });
    
    presetButton.appendChild(deleteButton);
    presetContainer.appendChild(presetButton);
}

// Load all user presets from storage
function loadUserPresets() {
    const presetContainer = document.querySelector('.user-presets');
    presetContainer.innerHTML = '';
    
    // Add each preset as a button
    for (const presetName in userPresets) {
        addUserPresetToUI(presetName);
    }
}

// Predefined presets
const presets = {
    'flower': {
        sides: 6,
        radius: 150,
        angleIncrement: 60,
        baseRotation: 0,
        waveType: 'sin',
        frequency: 6,
        amplitude: 50,
        phase: 0,
        enableSecondary: false,
        strokeColor: '#e74c3c',
        fillColor: '#f39c12',
        fillOpacity: 0.3,
        lineWidth: 2,
        colorMode: 'solid',
        animationSpeed: 1,
        animationTarget: 'phase'
    },
    'star': {
        sides: 5,
        radius: 150,
        angleIncrement: 72,
        baseRotation: 0,
        waveType: 'sin',
        frequency: 5,
        amplitude: 80,
        phase: 0,
        enableSecondary: false,
        strokeColor: '#9b59b6',
        fillColor: '#8e44ad',
        fillOpacity: 0.2,
        lineWidth: 2,
        colorMode: 'solid',
        animationSpeed: 1,
        animationTarget: 'phase'
    },
    'spiral': {
        sides: 1,
        radius: 150,
        angleIncrement: 0,
        baseRotation: 0,
        waveType: 'sin',
        frequency: 3,
        amplitude: 30,
        phase: 0,
        enableSecondary: true,
        secondaryWaveType: 'cos',
        secondaryFrequency: 5,
        secondaryAmplitude: 20,
        secondaryPhase: Math.PI/4,
        waveCombination: 'add',
        strokeColor: '#2ecc71',
        fillColor: '#27ae60',
        fillOpacity: 0.1,
        lineWidth: 2,
        colorMode: 'rainbow',
        animationSpeed: 1,
        animationTarget: 'phase'
    },
    'wave': {
        sides: 2,
        radius: 150,
        angleIncrement: 180,
        baseRotation: 90,
        waveType: 'sin',
        frequency: 8,
        amplitude: 60,
        phase: 0,
        enableSecondary: true,
        secondaryWaveType: 'cos',
        secondaryFrequency: 4,
        secondaryAmplitude: 30,
        secondaryPhase: 0,
        waveCombination: 'add',
        strokeColor: '#3498db',
        fillColor: '#2980b9',
        fillOpacity: 0.2,
        lineWidth: 2,
        colorMode: 'solid',
        animationSpeed: 1,
        animationTarget: 'phase'
    },
    'complex': {
        sides: 8,
        radius: 150,
        angleIncrement: 45,
        baseRotation: 22.5,
        waveType: 'sin',
        frequency: 8,
        amplitude: 40,
        phase: 0,
        enableSecondary: true,
        secondaryWaveType: 'triangle',
        secondaryFrequency: 16,
        secondaryAmplitude: 20,
        secondaryPhase: Math.PI/2,
        waveCombination: 'multiply',
        strokeColor: '#1abc9c',
        fillColor: '#16a085',
        fillOpacity: 0.15,
        lineWidth: 2,
        colorMode: 'gradient',
        animationSpeed: 1,
        animationTarget: 'phase'
    },
    'galaxy': {
        sides: 3,
        radius: 150,
        angleIncrement: 120,
        baseRotation: 30,
        waveType: 'sin',
        frequency: 12,
        amplitude: 70,
        phase: Math.PI/3,
        enableSecondary: true,
        secondaryWaveType: 'cos',
        secondaryFrequency: 6,
        secondaryAmplitude: 35,
        secondaryPhase: Math.PI/6,
        waveCombination: 'multiply',
        strokeColor: '#9b59b6',
        fillColor: '#8e44ad',
        fillOpacity: 0.2,
        lineWidth: 2,
        colorMode: 'gradient',
        animationSpeed: 2,
        animationTarget: 'multiple'
    },
    'snowflake': {
        sides: 6,
        radius: 150,
        angleIncrement: 60,
        baseRotation: 0,
        waveType: 'cos',
        frequency: 6,
        amplitude: 60,
        phase: 0,
        enableSecondary: true,
        secondaryWaveType: 'sin',
        secondaryFrequency: 18,
        secondaryAmplitude: 15,
        secondaryPhase: 0,
        waveCombination: 'add',
        strokeColor: '#3498db',
        fillColor: '#ffffff',
        fillOpacity: 0.1,
        lineWidth: 2,
        colorMode: 'solid',
        animationSpeed: 1,
        animationTarget: 'phase'
    },
    'vortex': {
        sides: 1,
        radius: 150,
        angleIncrement: 0,
        baseRotation: 0,
        waveType: 'sawtooth',
        frequency: 2,
        amplitude: 80,
        phase: 0,
        enableSecondary: true,
        secondaryWaveType: 'sin',
        secondaryFrequency: 8,
        secondaryAmplitude: 20,
        secondaryPhase: 0,
        waveCombination: 'add',
        strokeColor: '#e74c3c',
        fillColor: '#c0392b',
        fillOpacity: 0.1,
        lineWidth: 2,
        colorMode: 'rainbow',
        animationSpeed: 3,
        animationTarget: 'rotation'
    },
    'infinity': {
        sides: 2,
        radius: 150,
        angleIncrement: 180,
        baseRotation: 90,
        waveType: 'sin',
        frequency: 2,
        amplitude: 100,
        phase: 0,
        enableSecondary: true,
        secondaryWaveType: 'sin',
        secondaryFrequency: 4,
        secondaryAmplitude: 50,
        secondaryPhase: Math.PI/2,
        waveCombination: 'multiply',
        strokeColor: '#2c3e50',
        fillColor: '#34495e',
        fillOpacity: 0.2,
        lineWidth: 3,
        colorMode: 'solid',
        animationSpeed: 1,
        animationTarget: 'phase'
    },
    'rainbow': {
        sides: 12,
        radius: 150,
        angleIncrement: 30,
        baseRotation: 0,
        waveType: 'sin',
        frequency: 12,
        amplitude: 40,
        phase: 0,
        enableSecondary: true,
        secondaryWaveType: 'cos',
        secondaryFrequency: 6,
        secondaryAmplitude: 20,
        secondaryPhase: 0,
        waveCombination: 'add',
        strokeColor: '#3498db',
        fillColor: '#f1c40f',
        fillOpacity: 0.3,
        lineWidth: 2,
        colorMode: 'rainbow',
        animationSpeed: 2,
        animationTarget: 'multiple'
    }
};

// Event listeners for controls
sidesInput.addEventListener('input', () => {
    params.sides = parseInt(sidesInput.value);
    updateDisplay();
});

radiusInput.addEventListener('input', () => {
    params.radius = parseInt(radiusInput.value);
    updateDisplay();
});

angleInput.addEventListener('input', () => {
    params.angleIncrement = parseInt(angleInput.value);
    updateDisplay();
});

rotationInput.addEventListener('input', () => {
    params.baseRotation = parseFloat(rotationInput.value);
    updateDisplay();
});

waveTypeSelect.addEventListener('change', () => {
    params.waveType = waveTypeSelect.value;
    updateDisplay();
});

frequencyInput.addEventListener('input', () => {
    params.frequency = parseFloat(frequencyInput.value);
    updateDisplay();
});

amplitudeInput.addEventListener('input', () => {
    params.amplitude = parseInt(amplitudeInput.value);
    updateDisplay();
});

phaseInput.addEventListener('input', () => {
    params.phase = parseFloat(phaseInput.value);
    updateDisplay();
});

enableSecondaryToggle.addEventListener('change', () => {
    params.enableSecondary = enableSecondaryToggle.checked;
    secondaryControls.style.display = params.enableSecondary ? 'block' : 'none';
    updateDisplay();
});

secondaryWaveTypeSelect.addEventListener('change', () => {
    params.secondaryWaveType = secondaryWaveTypeSelect.value;
    updateDisplay();
});

secondaryFrequencyInput.addEventListener('input', () => {
    params.secondaryFrequency = parseFloat(secondaryFrequencyInput.value);
    updateDisplay();
});

secondaryAmplitudeInput.addEventListener('input', () => {
    params.secondaryAmplitude = parseInt(secondaryAmplitudeInput.value);
    updateDisplay();
});

secondaryPhaseInput.addEventListener('input', () => {
    params.secondaryPhase = parseFloat(secondaryPhaseInput.value);
    updateDisplay();
});

waveCombinationSelect.addEventListener('change', () => {
    params.waveCombination = waveCombinationSelect.value;
    updateDisplay();
});

strokeColorInput.addEventListener('input', () => {
    params.strokeColor = strokeColorInput.value;
    updateDisplay();
});

fillColorInput.addEventListener('input', () => {
    params.fillColor = fillColorInput.value;
    updateDisplay();
});

fillOpacityInput.addEventListener('input', () => {
    params.fillOpacity = parseFloat(fillOpacityInput.value);
    fillOpacityValue.textContent = params.fillOpacity.toFixed(2);
    updateDisplay();
});

lineWidthInput.addEventListener('input', () => {
    params.lineWidth = parseInt(lineWidthInput.value);
    lineWidthValue.textContent = params.lineWidth;
    updateDisplay();
});

colorModeSelect.addEventListener('change', () => {
    params.colorMode = colorModeSelect.value;
    updateDisplay();
});

animationToggle.addEventListener('change', toggleAnimation);

animationSpeedInput.addEventListener('input', () => {
    params.animationSpeed = parseInt(animationSpeedInput.value);
    animationSpeedValue.textContent = params.animationSpeed;
});

animationTargetSelect.addEventListener('change', () => {
    params.animationTarget = animationTargetSelect.value;
    updateDisplay();
});

// Event listeners for old export buttons (for backward compatibility)
if (exportBtn) {
    exportBtn.addEventListener('click', exportPNG);
}

if (exportSvgBtn) {
    exportSvgBtn.addEventListener('click', exportSVG);
}

if (exportVideoBtn) {
    exportVideoBtn.addEventListener('click', () => {
        const settingsPanel = document.getElementById('video-export-settings');
        if (settingsPanel) {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        } else {
            // Fallback to old UI
            if (videoExportOptions && videoExportOptions.style.display === 'none') {
                videoExportOptions.style.display = 'block';
            } else if (videoExportOptions) {
                videoExportOptions.style.display = 'none';
            }
        }
    });
}

// Preset button event listeners
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const presetName = button.getAttribute('data-preset');
        if (presets[presetName]) {
            loadPreset(presets[presetName]);
        }
    });
});

// Modal event listeners
savePresetBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    presetNameInput.value = '';
    presetNameInput.focus();
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

savePresetConfirmBtn.addEventListener('click', saveUserPreset);

// Handle window resize
window.addEventListener('resize', () => {
    setupCanvas();
    drawPattern();
});

// Event listeners for export options
document.getElementById('export-svg').addEventListener('click', exportSVG);
document.getElementById('export-video').addEventListener('click', () => {
    if (videoExportOptions.style.display === 'none') {
        videoExportOptions.style.display = 'block';
    } else {
        exportVideo();
    }
});

videoDurationInput.addEventListener('input', () => {
    videoExportSettings.duration = parseInt(videoDurationInput.value);
    videoDurationValue.textContent = videoExportSettings.duration;
});

videoFpsInput.addEventListener('input', () => {
    videoExportSettings.fps = parseInt(videoFpsInput.value);
    videoFpsValue.textContent = videoExportSettings.fps;
});

videoQualityInput.addEventListener('input', () => {
    videoExportSettings.quality = parseInt(videoQualityInput.value);
    const qualityText = ['Low', 'Medium', 'High'][videoExportSettings.quality - 1];
    videoQualityValue.textContent = qualityText;
});

// Initialize event listeners for video export settings
document.getElementById('video-duration').addEventListener('input', function() {
    const value = parseInt(this.value);
    document.getElementById('video-duration-value').textContent = value;
    videoExportSettings.duration = value;
});

document.getElementById('video-fps').addEventListener('input', function() {
    const value = parseInt(this.value);
    document.getElementById('video-fps-value').textContent = value;
    videoExportSettings.fps = value;
    
    // Update quality indicator
    const indicator = document.getElementById('fps-quality-indicator');
    if (value < 25) {
        indicator.className = 'quality-indicator quality-low';
        indicator.title = 'Low quality';
    } else if (value < 45) {
        indicator.className = 'quality-indicator quality-medium';
        indicator.title = 'Medium quality';
    } else {
        indicator.className = 'quality-indicator quality-high';
        indicator.title = 'High quality';
    }
});

document.getElementById('video-quality').addEventListener('input', function() {
    const value = parseInt(this.value);
    videoExportSettings.quality = value;
    
    const indicator = document.getElementById('quality-indicator');
    let qualityText = 'Medium';
    
    if (value === 1) {
        qualityText = 'Low';
        indicator.className = 'quality-indicator quality-low';
    } else if (value === 2) {
        qualityText = 'Medium';
        indicator.className = 'quality-indicator quality-medium';
    } else {
        qualityText = 'High';
        indicator.className = 'quality-indicator quality-high';
    }
    
    document.getElementById('video-quality-value').textContent = qualityText;
    indicator.title = qualityText + ' quality';
});

// Show/hide video export settings
document.getElementById('export-video').addEventListener('click', function() {
    const settingsPanel = document.getElementById('video-export-settings');
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});

// Export buttons
document.getElementById('export-png').addEventListener('click', exportPNG);
document.getElementById('export-svg').addEventListener('click', exportSVG);
document.getElementById('start-video-export').addEventListener('click', exportVideo);

// Initialize the application
function init() {
    setupCanvas();
    loadUserPresets();
    updateDisplay();
}

// Start the application
init();
