 const displayCanvas = document.getElementById('drawingCanvas');
        const displayCtx = displayCanvas.getContext('2d');

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 800;
        offscreenCanvas.height = 600;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        offscreenCtx.fillStyle = '#ffffff';
        offscreenCtx.fillRect(0, 0, 800, 600);

        displayCtx.drawImage(offscreenCanvas, 0, 0);

        let drawing = false;
        const colorPicker = document.getElementById('colorPicker');
        const severitySlider = document.getElementById('levelSlider');
        const levelValue = document.getElementById('levelValue');

        function renderFilter() {
            displayCtx.clearRect(0, 0, 800, 600);
            displayCtx.drawImage(offscreenCanvas, 0, 0);

            const strength = severitySlider.value / 100;
            const mode = document.querySelector('input[name="mode"]:checked').value;

            if(strength === 0) return;

            const imageData = displayCtx.getImageData(0, 0, 800, 600);
            const data = imageData.data;

            for(let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                let newR, newG, newB; 

                if(mode === 'simulate') {
                    newR = (0.367322 * r + 0.860646 * g - 0.227968 * b) * strength + r * (1 - strength);
                    newG = (0.280085 * r + 0.672501 * g + 0.047413 * b) * strength + g * (1 - strength);
                    newB = (-0.011820 * r + 0.042940 * g + 0.968881 * b) * strength + b * (1 - strength);
                } else {
                    let simR = 0.367322 * r + 0.860646 * g - 0.227968 * b;
                    let simG = 0.280085 * r + 0.672501 * g + 0.047413 * b;
                    let simB = -0.011820 * r + 0.042940 * g + 0.968881 * b;

                    let errR = r - simR;
                    let errG = g - simG;
                    let errB = b - simB;

                    let shiftR = errR * 0.0;
                    let shiftG = errG * 0.7;
                    let shiftB = (errR * 1.0) + (errG * 1.0);

                    newR = r + shiftR * strength;
                    newG = g + shiftG * strength;
                    newB = b + shiftB * strength;
                }

                data[i] = Math.min(255, Math.max(0, newR));
                data[i + 1] = Math.min(255, Math.max(0, newG));
                data[i + 2] = Math.min(255, Math.max(0, newB));
            }
            displayCtx.putImageData(imageData, 0, 0);
        }

        colorPicker.addEventListener('input', (e) => {
            offscreenCtx.strokeStyle = e.target.value;
            displayCtx.strokeStyle = e.target.value;
        });

        severitySlider.addEventListener('input', (e) => {
            levelValue.textContent = e.target.value;
            renderFilter();
        });

        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', renderFilter);
        });

        displayCanvas.addEventListener('mousedown', (e) => {
            drawing = true;
            offscreenCtx.lineWidth = 10;
            displayCtx.lineWidth = 10;

            offscreenCtx.beginPath();
            offscreenCtx.moveTo(e.offsetX, e.offsetY);
            
            displayCtx.beginPath();
            displayCtx.moveTo(e.offsetX, e.offsetY);
        });

        displayCanvas.addEventListener('mousemove', (e) => {
            if(!drawing) return;

            offscreenCtx.lineTo(e.offsetX, e.offsetY);
            offscreenCtx.stroke();

            if(severitySlider.value == 0){
                displayCtx.lineTo(e.offsetX, e.offsetY);
                displayCtx.stroke();
            }else{
                renderFilter();
            }   
        });

        displayCanvas.addEventListener('mouseup', () => {
            drawing = false;
        });
        displayCanvas.addEventListener('mouseleave', () => {
            drawing = false;
        });

        renderFilter();

        //=========================================
        //自测模块逻辑
        //=========================================
        const startTestBtn = document.getElementById('startTestBtn');
        const testModal = document.getElementById('testModal');
        const testBtns = document.querySelectorAll('.test-btn');

        startTestBtn.addEventListener('click', ()=>{
            testModal.style.display = 'flex';
        });

        testBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');

                testModal.style.display = 'none';

                if(type === 'redGreen'){
                    severitySlider.value = 80;
                    levelValue.textContent = 80;
                    document.querySelector('input[value="enhance"]').checked = true;
                    renderFilter();
                } else {
                    alert("您的色觉可能为正常,或属于其他罕见类型.已重置参数");
                    severitySlider.value = 0;
                    levelValue.textContent = 0;
                    renderFilter();
                }
            })
        })