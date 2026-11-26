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
        let isPicker = false;
        let historyStack = [];
        let currentColor = '#FF0000';
        let isSplit = false;

        const colorPicker = document.getElementById('colorPicker');
        const sizeSlider = document.getElementById('sizeSlider');
        const opacitySlider = document.getElementById('opacitySlider');
        const contrastSlider = document.getElementById('contrastSlider');
        const eraserBtn = document.getElementById('eraserBtn');
        const clearBtn = document.getElementById('clearBtn');
        const pickerBtn = document.getElementById('pickerBtn');
        const undoBtn = document.getElementById('undoBtn');
        const splitBtn = document.getElementById('splitBtn');
        const downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        const downloadFilteredBtn = document.getElementById('downloadFilteredBtn');
        
        const maxHistory = 20;
        const severitySlider = document.getElementById('levelSlider');
        const levelValue = document.getElementById('levelValue');
        const cvdTypeSelect = document.getElementById('cvdTypeSelect');
        
        const startTestBtn = document.getElementById('startTestBtn');
        const testModal = document.getElementById('testModal');
        const testBtns = document.querySelectorAll('.test-btn');
        
        const welcomeModal = document.getElementById('welcomeModal');
        const closeWelcomeBtn = document.getElementById('closeWelcomeBtn');
        const toast = document.getElementById('toast');

        offscreenCtx.strokeStyle = currentColor;
        offscreenCtx.lineWidth = sizeSlider.value;
        leftCtx.lineWidth = sizeSlider.value;
        rightCtx.lineWidth = sizeSlider.value;

        let toastTimeout;
        function showToast(message) {
            toast.innerText = message;
            toast.style.opacity = '1';
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toast.style.opacity = '0';
            }, 2000);
        }

        function renderFilter() {
            leftCtx.clearRect(0, 0, 800, 600);
            leftCtx.drawImage(offscreenCanvas, 0, 0);

            rightCtx.clearRect(0, 0, 800, 600);
            rightCtx.drawImage(offscreenCanvas, 0, 0);

            const strength = severitySlider.value / 100;
            const mode = document.querySelector('input[name="mode"]:checked').value;
            const cvdType = cvdTypeSelect.value;
            const contrast = contrastSlider.value / 100;

            if(strength === 0 && contrast === 1 && !isSplit) return;

            const imageData = rightCtx.getImageData(0, 0, 800, 600);
            const data = imageData.data;

            const startX = isSplit ? 400 : 0;

            for(let y = 0; y < 600; y++) {
                for(let x = startX; x < 800; x++) {
                    const i = (y * 800 + x) * 4;
                    
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

                    newR = ((newR / 255 - 0.5) * contrast + 0.5) * 255;
                    newG = ((newG / 255 - 0.5) * contrast + 0.5) * 255;
                    newB = ((newB / 255 - 0.5) * contrast + 0.5) * 255;

                    data[i] = Math.min(255, Math.max(0, newR));
                    data[i + 1] = Math.min(255, Math.max(0, newG));
                    data[i + 2] = Math.min(255, Math.max(0, newB));
                }
            }
            
            rightCtx.putImageData(imageData, 0, 0);

            if (isSplit) {
                rightCtx.beginPath();
                rightCtx.moveTo(400, 0);
                rightCtx.lineTo(400, 600);
                rightCtx.strokeStyle = 'red';
                rightCtx.lineWidth = 2;
                rightCtx.stroke();
            }
        }

        function saveHistory(){
            if(historyStack.length >= maxHistory){
                historyStack.shift();
            }
            const snapshot = new Image();
            snapshot.src = offscreenCanvas.toDataURL();
            historyStack.push(snapshot);
        }

        function undo(){
            if(historyStack.length > 1){
                historyStack.pop();
                const previousState = historyStack[historyStack.length - 1];
                offscreenCtx.clearRect(0, 0, 800, 600);
                offscreenCtx.drawImage(previousState, 0, 0);
                renderFilter();
                showToast("已撤销上一步");
            } else {
                showToast("没有可撤销的记录了");
            }
        }

        colorPicker.addEventListener('input', (e) => {
            currentColor = e.target.value; 
            isEraser = false;
            offscreenCtx.strokeStyle = currentColor; 
            leftCtx.strokeStyle = currentColor;
        });

        sizeSlider.addEventListener('input', (e) => {
            offscreenCtx.lineWidth = e.target.value; 
            leftCtx.lineWidth = e.target.value; 
            rightCtx.lineWidth = e.target.value;
        });

        opacitySlider.addEventListener('input', (e) => {
            offscreenCtx.globalAlpha = e.target.value / 100;
        });

        contrastSlider.addEventListener('input', renderFilter);

        eraserBtn.addEventListener('click', () => {
            isEraser = true; 
            isPicker = false;
            offscreenCtx.strokeStyle = '#FFFFFF'; 
            leftCtx.strokeStyle = '#FFFFFF';
            showToast("已切换到橡皮擦");
        });

        pickerBtn.addEventListener('click', () => {
            isPicker = !isPicker;
            isEraser = false;
            pickerBtn.style.background = isPicker ? '#4CAF50' : '#E91E63';
            pickerBtn.innerText = isPicker ? '吸管: 开启' : '吸管: 关闭';
            if(isPicker) showToast("吸管已开启，请点击画布取色");
        });

        splitBtn.addEventListener('click', () => {
            isSplit = !isSplit;
            splitBtn.innerText = isSplit ? '关闭对比分屏' : '开启对比分屏';
            splitBtn.style.background = isSplit ? '#E91E63' : '#9C27B0';
            renderFilter();
        });

        clearBtn.addEventListener('click', () => {
            offscreenCtx.fillStyle = '#ffffff'; 
            offscreenCtx.fillRect(0, 0, 800, 600); 
            renderFilter(); 
            saveHistory();
            showToast("画布已清空");
        });

        severitySlider.addEventListener('input', (e) => { 
            levelValue.textContent = e.target.value; 
            renderFilter(); 
        });

        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', renderFilter);
        });
        
        cvdTypeSelect.addEventListener('change', renderFilter);
        undoBtn.addEventListener('click', undo);

        downloadOriginalBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'ColorWeak_Original.png';
            link.href = leftCanvas.toDataURL('image/png');
            link.click();
            showToast("原图已保存到本地");
        });

        downloadFilteredBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'ColorWeak_Filtered.png';
            link.href = rightCanvas.toDataURL('image/png');
            link.click();
            showToast("滤镜图已保存到本地");
        });

        function getCoords(e) {
            if(e.touches && e.touches.length > 0){
                const rect = e.target.getBoundingClientRect();
                return{
                    x:e.touches[0].clientX - rect.left,
                    y:e.touches[0].clientY - rect.top
                };
            }
            return { x: e.offsetX, y: e.offsetY};
        }

        function handleDown(e){
            if(e.type === 'touchstart') e.preventDefault();

            if(isPicker){
                const coords = getCoords(e);
                const pixel = rightCtx.getImageData(coords.x, coords.y, 1, 1).data;
                const r = pixel[0], g = pixel[1], b = pixel[2];
                const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                showToast(`已取色: ${hex} | RGB: (${r}, ${g}, ${b})`);

                isPicker = false;
                pickerBtn.style.background = '#E91E63';
                pickerBtn.innerText = '吸管: 关闭';
                return;
            }
            drawing = true;
            points = [];
            
            const coords = getCoords(e);
            points.push(coords);

            const colorToUse = isEraser ? '#FFFFFF' : currentColor;
            offscreenCtx.strokeStyle = colorToUse;
            offscreenCtx.globalAlpha = isEraser ? 1 : (opacitySlider.value / 100);

            offscreenCtx.beginPath();
            offscreenCtx.arc(coords.x, coords.y, offscreenCtx.lineWidth /2, 0, Math.PI * 2);
            offscreenCtx.fillStyle = colorToUse;
            offscreenCtx.fill();
            renderFilter();
        }

        function handleMove(e){
            if(!drawing) return;
            if(e.type === 'touchmove') e.preventDefault();

            const coords = getCoords(e);
            points.push(coords);

            if(points.length >= 3){
                const p1 = points[points.length - 3], p2 = points[points.length - 2], p3 = points[points.length - 1];
                const xc  = (p2.x + p3.x) / 2, yc = (p2.y + p3.y) / 2;

                offscreenCtx.beginPath();
                offscreenCtx.moveTo(p1.x, p1.y);
                offscreenCtx.quadraticCurveTo(p2.x, p2.y, xc, yc);
                offscreenCtx.stroke();
                renderFilter();
            }
        }

        function handleUp() {
            drawing = false; 
            saveHistory();
        }

        [leftCanvas, rightCanvas].forEach(canvas => {
            canvas.addEventListener('mousedown', handleDown);
            canvas.addEventListener('mousemove', handleMove);
            canvas.addEventListener('mouseup', handleUp);
            canvas.addEventListener('mouseleave', handleUp);

            canvas.addEventListener('touchstart', handleDown, { passive: false});
            canvas.addEventListener('touchmove', handleMove,{ passive: false});
            canvas.addEventListener('touchend', handleUp);
            canvas.addEventListener('touchcancel', handleUp);
        });

        startTestBtn.addEventListener('click', ()=>{ testModal.style.display = 'flex'; });
        
        testBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                testModal.style.display = 'none';
                if(type === 'redGreen'){
                    cvdTypeSelect.value = 'deuteranomaly'; severitySlider.value = 80; levelValue.textContent = 80;
                    document.querySelector('input[value="enhance"]').checked = true; renderFilter();
                    showToast("已为您配置红绿色弱增强模式");
                } else if (type === 'blueYellow'){
                    cvdTypeSelect.value = 'tritanomaly'; severitySlider.value = 80; levelValue.textContent = 80;
                    document.querySelector('input[value="enhance"]').checked = true; renderFilter();
                    showToast("已为您配置蓝黄色弱增强模式");
                } else {
                    severitySlider.value = 0; levelValue.textContent = 0; renderFilter();
                    showToast("已重置为原始视角");
                }
            })
        });

        closeWelcomeBtn.addEventListener('click', ()=> {
            welcomeModal.style.display = 'none';
            showToast("欢迎体验");
        });

        saveHistory();
        renderFilter();