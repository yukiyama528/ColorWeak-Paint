
        const leftCanvas = document.getElementById('leftCanvas');
        const leftCtx = leftCanvas.getContext('2d');
        
        const rightCanvas = document.getElementById('rightCanvas');
        const rightCtx = rightCanvas.getContext('2d');

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 800;
        offscreenCanvas.height = 600;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.fillStyle = '#ffffff';
        offscreenCtx.fillRect(0, 0, 800, 600);

        let drawing = false;
        let points = [];
        let isEraser = false;
        let currentColor = '#FF0000';

        const colorPicker = document.getElementById('colorPicker');
        const sizeSlider = document.getElementById('sizeSlider');
        const eraserBtn = document.getElementById('eraserBtn');
        const clearBtn = document.getElementById('clearBtn');
        const severitySlider = document.getElementById('levelSlider');
        const levelValue = document.getElementById('levelValue');
        const cvdTypeSelect = document.getElementById('cvdTypeSelect');

        offscreenCtx.strokeStyle = currentColor;
        offscreenCtx.lineWidth = sizeSlider.value;
        leftCtx.lineWidth = sizeSlider.value;
        rightCtx.lineWidth = sizeSlider.value;

        function renderFilter() {
            leftCtx.clearRect(0, 0, 800, 600);
            leftCtx.drawImage(offscreenCanvas, 0, 0);

            rightCtx.clearRect(0, 0, 800, 600);
            rightCtx.drawImage(offscreenCanvas, 0, 0);

            const strength = severitySlider.value / 100;
            const mode = document.querySelector('input[name="mode"]:checked').value;
            const cvdType = cvdTypeSelect.value;

            if(strength === 0) return;

            const imageData = rightCtx.getImageData(0, 0, 800, 600);
            const data = imageData.data;

            for(let i = 0; i < data.length; i += 4) {
                let r = data[i], g = data[i+1], b = data[i+2];
                let newR, newG, newB; 

                if(cvdType === 'deuteranomaly'){
                    if(mode === 'simulate') {
                        newR = (0.367322 * r + 0.860646 * g - 0.227968 * b) * strength + r * (1 - strength);
                        newG = (0.280085 * r + 0.672501 * g + 0.047413 * b) * strength + g * (1 - strength);
                        newB = (-0.011820 * r + 0.042940 * g + 0.968881 * b) * strength + b * (1 - strength);
                    } else {
                        let simR = 0.367322 * r + 0.860646 * g - 0.227968 * b;
                        let simG = 0.280085 * r + 0.672501 * g + 0.047413 * b;
                        let simB = -0.011820 * r + 0.042940 * g + 0.968881 * b;
                        let errR = r - simR, errG = g - simG, errB = b - simB;
                        newR = r + (errR * 0.0) * strength;
                        newG = g + (errG * 0.7) * strength;
                        newB = b + ((errR * 1.0) + (errG * 1.0)) * strength;
                    }
                } else {
                    if(mode === 'simulate'){
                        newR = (0.950 * r + 0.050 * g) * strength + r * (1 - strength);
                        newG = (0.433 * g + 0.567 * b) * strength + g * (1 - strength);
                        newB = (0.475 * g + 0.525 * b) * strength + b * (1 - strength);
                    } else {
                        let simR = 0.950 * r + 0.050 * g;
                        let simG = 0.433 * g + 0.567 * b;
                        let simB = 0.475 * g + 0.525 * b;
                        let errR = r - simR, errG = g - simG, errB = b - simB;
                        newR = r + (errR * 0.5) * strength;
                        newG = g + (errG * 1.0) * strength;
                        newB = b + (errB * 0.5) * strength;
                    }
                }

                data[i] = Math.min(255, Math.max(0, newR));
                data[i + 1] = Math.min(255, Math.max(0, newG));
                data[i + 2] = Math.min(255, Math.max(0, newB));
            }
            rightCtx.putImageData(imageData, 0, 0);
        }

        colorPicker.addEventListener('input', (e) => {
            currentColor = e.target.value; isEraser = false;
            offscreenCtx.strokeStyle = currentColor; leftCtx.strokeStyle = currentColor;
        });
        sizeSlider.addEventListener('input', (e) => {
            offscreenCtx.lineWidth = e.target.value; leftCtx.lineWidth = e.target.value; rightCtx.lineWidth = e.target.value;
        });
        eraserBtn.addEventListener('click', () => {
            isEraser = true; offscreenCtx.strokeStyle = '#FFFFFF'; leftCtx.strokeStyle = '#FFFFFF';
        });
        clearBtn.addEventListener('click', () => {
            offscreenCtx.fillStyle = '#ffffff'; offscreenCtx.fillRect(0, 0, 800, 600); renderFilter();
        });
        severitySlider.addEventListener('input', (e) => { levelValue.textContent = e.target.value; renderFilter(); });
        document.querySelectorAll('input[name="mode"]').forEach(radio => radio.addEventListener('change', renderFilter));
        cvdTypeSelect.addEventListener('change', renderFilter);

        function handleDown(e) {
            drawing = true; points = [];
            points.push({ x: e.offsetX, y: e.offsetY });
            const colorToUse = isEraser ? '#FFFFFF' : currentColor;
            offscreenCtx.strokeStyle = colorToUse;
            
            offscreenCtx.beginPath();
            offscreenCtx.arc(e.offsetX, e.offsetY, offscreenCtx.lineWidth / 2, 0, Math.PI * 2);
            offscreenCtx.fillStyle = colorToUse; offscreenCtx.fill();
            renderFilter();
        }

        function handleMove(e) {
            if(!drawing) return;
            points.push({ x: e.offsetX, y: e.offsetY });
            if(points.length >= 3){
                const p1 = points[points.length - 3], p2 = points[points.length - 2], p3 = points[points.length - 1];
                const xc = (p2.x + p3.x) / 2, yc = (p2.y + p3.y) / 2;
                offscreenCtx.beginPath();
                offscreenCtx.moveTo(p1.x, p1.y);
                offscreenCtx.quadraticCurveTo(p2.x, p2.y, xc, yc);
                offscreenCtx.stroke();
                renderFilter();
            }
        }

        function handleUp() { drawing = false; }

        [leftCanvas, rightCanvas].forEach(canvas => {
            canvas.addEventListener('mousedown', handleDown);
            canvas.addEventListener('mousemove', handleMove);
            canvas.addEventListener('mouseup', handleUp);
            canvas.addEventListener('mouseleave', handleUp);
        });

        const startTestBtn = document.getElementById('startTestBtn');
        const testModal = document.getElementById('testModal');
        const testBtns = document.querySelectorAll('.test-btn');
        startTestBtn.addEventListener('click', ()=>{ testModal.style.display = 'flex'; });
        testBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                testModal.style.display = 'none';
                if(type === 'redGreen'){
                    cvdTypeSelect.value = 'deuteranomaly'; severitySlider.value = 80; levelValue.textContent = 80;
                    document.querySelector('input[value="enhance"]').checked = true; renderFilter();
                } else if (type === 'blueYellow'){
                    alert("您可能是蓝黄色弱,已切换至相应模式");
                    cvdTypeSelect.value = 'tritanomaly'; severitySlider.value = 80; levelValue.textContent = 80;
                    document.querySelector('input[value="enhance"]').checked = true; renderFilter();
                } else {
                    alert("您的色觉可能为正常,或属于其他罕见类型.已重置参数");
                    severitySlider.value = 0; levelValue.textContent = 0; renderFilter();
                }
            })
        });

        renderFilter();