let gl;
let shaderProgram;
let angle = 0;
let fanOffsetY = 0;
let fanDirection = 1;

let squareBuffer, squareColorBuffer;
let fanBuffer, fanColorBuffer;

window.onload = function setupWebGL() {
  const canvas = document.getElementById("webgl-canvas");
  gl = canvas.getContext("webgl");

  if (!gl) {
    alert("Ваш браузер не підтримує WebGL!");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);

  initShaders();
  initBuffers();

  requestAnimationFrame(drawScene);
};

function initShaders() {
  const vsSource = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    uniform mat4 uModelViewMatrix;
    varying vec3 vColor;
    void main(void) {
      gl_Position = uModelViewMatrix * vec4(aPosition, 1.0);
      vColor = aColor;
    }
  `;

  const fsSource = `
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `;

  const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Помилка створення шейдерної програми!");
    return;
  }

  gl.useProgram(shaderProgram);

  shaderProgram.aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
  shaderProgram.aColor = gl.getAttribLocation(shaderProgram, "aColor");
  shaderProgram.uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Помилка компіляції шейдера:", gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initBuffers() {
  const squareVertices = [
    -0.25,  0.25, 0.0,
    -0.25, -0.25, 0.0,
     0.25,  0.25, 0.0,

     0.25,  0.25, 0.0,
    -0.25, -0.25, 0.0,
     0.25, -0.25, 0.0
  ];

  const squareColors = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,

    0.0, 0.0, 1.0,
    0.0, 1.0, 0.0,
    1.0, 0.0, 0.0
  ];

  squareBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);

  squareColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareColors), gl.STATIC_DRAW);

  const fanVertices = [0.0, 0.0, 0.0];
  const r = 0.3;
  for (let i = 0; i <= 6; i++) {
    const angle = i * Math.PI / 3;
    fanVertices.push(r * Math.cos(angle), r * Math.sin(angle), 0.0);
  }

  const fanColors = [
    1.0, 1.0, 1.0, 
    1.0, 0.0, 0.0,
    1.0, 0.5, 0.0,
    1.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
    0.5, 0.0, 1.0,
    1.0, 0.0, 0.0
  ];

  fanBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fanBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fanVertices), gl.STATIC_DRAW);

  fanColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fanColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fanColors), gl.STATIC_DRAW);
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawObject(squareBuffer, squareColorBuffer, [0.0, 0.0, 0.0], angle, 6, gl.TRIANGLES);

  drawObject(fanBuffer, fanColorBuffer, [0.6, fanOffsetY, 0.0], 0, 8, gl.TRIANGLE_FAN);

  animate();
  requestAnimationFrame(drawScene);
}

function drawObject(vertexBuffer, colorBuffer, translate, rotation, count, mode) {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, translate);
  if (rotation) mat4.rotateZ(modelViewMatrix, modelViewMatrix, rotation);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.aPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(shaderProgram.aColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.aColor);

  gl.uniformMatrix4fv(shaderProgram.uModelViewMatrix, false, modelViewMatrix);
  gl.drawArrays(mode, 0, count);
}

function animate() {
  angle += 0.02;
  fanOffsetY += 0.01 * fanDirection; 
  if (fanOffsetY > 0.7 || fanOffsetY < -0.7) fanDirection *= -1;
}

const mat4 = {
  create: () => new Float32Array([1, 0, 0, 0,
                                  0, 1, 0, 0,
                                  0, 0, 1, 0,
                                  0, 0, 0, 1]),
  translate: (m, _, v) => {
    m[12] += v[0]; m[13] += v[1]; m[14] += v[2];
  },
  rotateZ: (m, _, rad) => {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m0 = m[0], m4 = m[4];
    m[0] = c * m0 - s * m[1];
    m[4] = c * m4 - s * m[5];
    m[1] = s * m0 + c * m[1];
    m[5] = s * m4 + c * m[5];
  }
};
