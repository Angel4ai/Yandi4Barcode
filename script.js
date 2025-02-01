// 1. הגדרת סצנת AR
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('ar-container').appendChild(renderer.domElement);

// 2. הגדרת AR.js
const arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'https://raw.githack.com/AR-js-org/AR.js/master/data/data/camera_para.dat',
    detectionMode: 'mono',
});
arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});

// 3. טעינת סרטון
const video = document.createElement('video');
video.src = 'assets/video.mp4';
video.loop = true;
video.muted = true;
const videoTexture = new THREE.VideoTexture(video);
const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
const videoGeometry = new THREE.PlaneGeometry(1.6, 0.9); // יחס 16:9
const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
videoMesh.visible = false; // מוסתר בהתחלה
scene.add(videoMesh);

// 4. יצירת אפקט פיצוץ
function createExplosion() {
    // חלקיקים
    const particles = new THREE.BufferGeometry();
    const particleCount = 1000;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 2;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x00ff00, // צבע החלקיקים (לשנות לרצונך)
    });
    const particleMesh = new THREE.Points(particles, particleMaterial);
    scene.add(particleMesh);

    // אנימציה עם GSAP
    gsap.to(particleMesh.position, {
        y: 2,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => {
            scene.remove(particleMesh); // הסר חלקיקים
            videoMesh.visible = true; // הצג סרטון
            video.play(); // הפעל סרטון
        }
    });
}

// 5. זיהוי קוד QR
const markerRoot = new THREE.Group();
scene.add(markerRoot);
const arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam',
});
arToolkitSource.init(() => {
    arToolkitSource.onResize();
});
arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});

// 6. לולאת רינדור
function animate() {
    requestAnimationFrame(animate);
    if (arToolkitContext.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
        scene.visible = camera.visible;
    }
    renderer.render(scene, camera);
}
animate();

// 7. זיהוי מרקר והפעלת אפקט
document.addEventListener('arjs-marker-found', (event) => {
    createExplosion(); // הפעל פיצוץ
});