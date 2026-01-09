import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface DepthViewerProps {
  imageUrl: string;
  depthUrl: string;
  className?: string;
}

export const DepthViewer: React.FC<DepthViewerProps> = ({ imageUrl, depthUrl, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const requestRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        // Flip Y for WebGL texture coords
        vUv.y = 1.0 - vUv.y;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D uImage;
      uniform sampler2D uDepth;
      uniform vec2 uMouse;
      uniform vec2 uResolution;
      varying vec2 vUv;

      void main() {
        vec4 depthMap = texture2D(uDepth, vUv);
        float depth = depthMap.r;
        
        // Parallax strength
        vec2 offset = (uMouse - 0.5) * 0.03 * depth;
        
        // Simple displacement
        gl_FragColor = texture2D(uImage, vUv - offset);
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Textures
    const createTexture = (src: string, unit: number) => {
      const texture = gl.createTexture();
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = src;
      image.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Resize canvas to match aspect ratio of original image
        if (unit === 0) {
            const aspect = image.width / image.height;
            // Max width/height logic usually handled by CSS, but internal resolution needs match
            canvas.width = image.width;
            canvas.height = image.height;
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            setIsLoaded(prev => true); // Trigger loaded only after main image loads
        }
      };
      return texture;
    };

    const imageTexture = createTexture(imageUrl, 0);
    const depthTexture = createTexture(depthUrl, 1);

    const uImageLocation = gl.getUniformLocation(program, 'uImage');
    const uDepthLocation = gl.getUniformLocation(program, 'uDepth');
    const uMouseLocation = gl.getUniformLocation(program, 'uMouse');

    gl.uniform1i(uImageLocation, 0);
    gl.uniform1i(uDepthLocation, 1);

    // Animation Loop
    const render = () => {
      // Smooth mouse
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.1;

      gl.uniform2f(uMouseLocation, mouseRef.current.x, mouseRef.current.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestRef.current = requestAnimationFrame(render);
    };

    render();

    // Event Listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL Y is flipped relative to screen usually
      targetMouseRef.current = { x, y };
    };
    
    // Add event listener to window or container? Container is better but window covers moving out
    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [imageUrl, depthUrl]);

  return (
    <div 
        ref={containerRef} 
        className={`relative w-full h-full flex items-center justify-center bg-black/20 rounded-xl overflow-hidden ${className}`}
    >
      {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-white/50 gap-2">
            <Loader2 className="w-5 h-5 animate-spin"/>
            <span>Loading 3D View...</span>
          </div>
      )}
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full object-contain ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`} 
      />
    </div>
  );
};
