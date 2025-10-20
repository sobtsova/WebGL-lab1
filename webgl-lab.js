let gl;
let shaderProgram; 

let squareVertexBuffer;
let squareColorBuffer;
let angle = 0.0; 

let fanVertexBuffer;
let fanColorBuffer;
let fanOffsetY = 0.0; 
let fanDirection = 1; 

let modelViewMatrix;
let projectionMatrix;


window.onload = function() {
    const canvas = document.getElementById('webgl-canvas');
    gl = setupWebGL(canvas);
    if (!gl) return;

    const vertexShaderSource = `
        attribute vec3 a_position;
        attribute vec3 a_color;
        uniform mat4 u_modelViewMatrix;
        uniform mat4 u_projectionMatrix;
        varying vec3 v_color;

        void main(void) {
            gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
            v_color = a_color;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        varying vec3 v_color;

        void main(void) {
            gl_FragColor = vec4(v_color, 1.0);
        }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    shaderProgram = createProgram(gl, vertexShader, fragmentShader);

    shaderProgram.positionAttribute = gl.getAttribLocation(shaderProgram, 'a_position');
    shaderProgram.colorAttribute = gl.getAttribLocation(shaderProgram, 'a_color');
    shaderProgram.modelViewMatrixUniform = gl.getUniformLocation(shaderProgram, 'u_modelViewMatrix');
    shaderProgram.projectionMatrixUniform = gl.getUniformLocation(shaderProgram, 'u_projectionMatrix');
    
    gl.enableVertexAttribArray(shaderProgram.positionAttribute);
    gl.enableVertexAttribArray(shaderProgram.colorAttribute);

    setupBuffers();

    modelViewMatrix = mat4.create();
    projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

    animate();
};

function setupWebGL(canvas) {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        alert('Ваш браузер не підтримує WebGL.');
        return null;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.2, 1.0); 
    gl.enable(gl.DEPTH_TEST);
    return gl;
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Помилка компіляції шейдера: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Помилка зв\'язування програми: ' + gl.getProgramInfoLog(program));
        return null;
    }
    gl.useProgram(program);
    return program;
}


function setupBuffers() {
    squareVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    const squareVertices = [
        -0.25,  0.25, 0.0,
        -0.25, -0.25, 0.0,
         0.25,  0.25, 0.0,

         0.25,  0.25, 0.0,
        -0.25, -0.25, 0.0,
         0.25, -0.25, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);

    squareColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareColorBuffer);
    const squareColors = [
        1.0, 0.0, 0.0, 
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,

        0.0, 0.0, 1.0, 
        0.0, 1.0, 0.0,
        1.0, 1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareColors), gl.STATIC_DRAW);

    fanVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fanVertexBuffer);
    const fanVertices = [
        0.0, 0.0, 0.0,
        
        0.3, 0.0, 0.0,
        0.15, 0.26, 0.0,
        -0.15, 0.26, 0.0,
        -0.3, 0.0, 0.0,
        -0.15, -0.26, 0.0,
        0.15, -0.26, 0.0,
        0.3, 0.0, 0.0 
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fanVertices), gl.STATIC_DRAW);

    fanColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fanColorBuffer);
    const fanColors = [
        1.0, 1.0, 1.0, 
  
        1.0, 0.5, 0.0,
        1.0, 1.0, 0.0, 
        0.5, 1.0, 0.0, 
        0.0, 1.0, 1.0,
        0.0, 0.5, 1.0,
        1.0, 0.0, 1.0,
        1.0, 0.5, 0.0 
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fanColors), gl.STATIC_DRAW);
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

    mat4.identity(modelViewMatrix);
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, angle);
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform, false, modelViewMatrix);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    gl.vertexAttribPointer(shaderProgram.positionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareColorBuffer);
    gl.vertexAttribPointer(shaderProgram.colorAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.6, fanOffsetY, 0.0]); 
    mat4.scale(modelViewMatrix, modelViewMatrix, [0.7, 0.7, 0.7]);
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform, false, modelViewMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, fanVertexBuffer);
    gl.vertexAttribPointer(shaderProgram.positionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, fanColorBuffer);
    gl.vertexAttribPointer(shaderProgram.colorAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 8);
}

function animate() {
    angle += 0.01;

    fanOffsetY += 0.01 * fanDirection;
    if (fanOffsetY > 0.7 || fanOffsetY < -0.7) {
        fanDirection *= -1;
    }

    drawScene();
    requestAnimationFrame(animate);
}

const mat4 = {
    create: function() {
        return new Float32Array(16);
    },
    identity: function(out) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    },
    ortho: function(out, left, right, bottom, top, near, far) {
        let lr = 1 / (left - right);
        let bt = 1 / (bottom - top);
        let nf = 1 / (near - far);
        out[0] = -2 * lr; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = -2 * bt; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 2 * nf; out[11] = 0;
        out[12] = (left + right) * lr;
        out[13] = (top + bottom) * bt;
        out[14] = (far + near) * nf;
        out[15] = 1;
        return out;
    },
    translate: function(out, a, v) {
        let x = v[0], y = v[1], z = v[2];
        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            mat4.identity(out);
            out[12] = x;
            out[13] = y;
        }
        return out;
    },
    rotateZ: function(out, a, rad) {
        let s = Math.sin(rad);
        let c = Math.cos(rad);
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        
        if (a !== out) { 
            out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
            out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        }
        
        out[0] = a00 * c + a10 * s;
        out[1] = a01 * c + a11 * s;
        out[2] = a02 * c + a12 * s;
        out[3] = a03 * c + a13 * s;
        out[4] = a10 * c - a00 * s;
        out[5] = a11 * c - a01 * s;
        out[6] = a12 * c - a02 * s;
        out[7] = a13 * c - a03 * s;
        return out;
    },
    scale: function(out, a, v) {
        let x = v[0], y = v[1], z = v[2];
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
};
