import { useEffect, useMemo, useRef, VFC } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { useFrame } from '@react-three/fiber';
import { cnoise31 } from '../modules/glsl';
import { GUIController } from '../modules/gui';
import { outerCubeState } from '../modules/store';

export const Cubes: VFC = () => {
	const ref = useRef<THREE.Group>(null)

	useFrame(({ clock }) => {
		ref.current!.rotation.x += 0.002
		ref.current!.rotation.y += 0.002
		ref.current!.position.y = Math.sin(clock.getElapsedTime())
	})

	return (
		<group ref={ref}>
			<InnerCubes />
			<OuterCubes />
		</group>
	)
}

// ========================================================
const genPositions = (x: number, y: number, z: number) => {
	const positions: number[] = []
	const offset = { x: x / 2 - 0.5, y: y / 2 - 0.5, z: z / 2 - 0.5 }

	for (let ix = 0; ix < x; ix++) {
		for (let iy = 0; iy < y; iy++) {
			for (let iz = 0; iz < z; iz++) {
				if (ix === 0 || ix === x - 1 || iy === 0 || iy === y - 1 || iz === 0 || iz === z - 1) {
					positions.push(ix - offset.x, iy - offset.y, iz - offset.z)
				}
			}
		}
	}
	return positions
}

// ========================================================
const InnerCubes: VFC = () => {
	const meshRef = useRef<THREE.InstancedMesh>(null)

	const positions = genPositions(8, 8, 8)
	const amount = positions.length / 3

	useEffect(() => {
		const object = new THREE.Object3D()

		for (let i = 0; i < amount; i++) {
			object.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
			object.updateMatrix()

			meshRef.current!.setMatrixAt(i, object.matrix)
		}
	}, [amount, positions])

	const geometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.1)

	return (
		<instancedMesh ref={meshRef} args={[geometry, undefined, amount]} castShadow receiveShadow>
			<meshLambertMaterial color={'#88bedf'} emissive={new THREE.Color('#093147')} />
		</instancedMesh>
	)
}

// ========================================================

const OuterCubes: VFC = () => {
	const meshRef = useRef<THREE.InstancedMesh>(null)

	// --------------------------------------------
	// add controller

	const gui = GUIController.instance.setFolder('Uniforms')
	gui.addNumericSlider(outerCubeState, 'noiseScale', 0.01, 1, 0.01, 'Noise Scale')
	gui.addNumericSlider(outerCubeState, 'noiseSpeed', 0.1, 2, 0.1, 'Noise Speed')
	gui.setFolder('Box')
	gui.addCheckBox(outerCubeState, 'receiveShadow', 'Receive Shadow')

	// --------------------------------------------
	// create position

	const positions = genPositions(10, 10, 10)
	const amount = positions.length / 3

	// --------------------------------------------
	// set matrix

	useEffect(() => {
		const object = new THREE.Object3D()

		for (let i = 0; i < amount; i++) {
			object.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
			object.updateMatrix()

			meshRef.current!.setMatrixAt(i, object.matrix)
		}
	}, [amount, positions])

	// --------------------------------------------
	// create geometry

	const geometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.1)
	geometry.setAttribute('a_pos', new THREE.InstancedBufferAttribute(Float32Array.from(positions), 3))

	// --------------------------------------------
	// create custom material

	const material = new THREE.MeshLambertMaterial({ color: '#b5e1fa', emissive: '#093147' })
	material.onBeforeCompile = shader => {
		// uniforms
		shader.uniforms.u_time = { value: 0 }
		shader.uniforms.u_noiseScale = { value: outerCubeState.noiseScale }
		shader.uniforms.u_noiseSpeed = { value: outerCubeState.noiseSpeed }
		// vertex
		shader.vertexShader = vertexShaderDefines + shader.vertexShader
		shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', project_vertex)
		// fragment
		shader.fragmentShader = fragmentShaderDefines + shader.fragmentShader
		shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', color_fragment)

		// console.log(shader.fragmentShader)

		material.userData.shader = shader
	}

	const depthMaterial = useMemo(() => {
		const depth = THREE.ShaderLib['depth']
		return new THREE.ShaderMaterial({
			uniforms: Object.assign(depth.uniforms, {
				u_time: { value: 0 },
				u_noiseScale: { value: outerCubeState.noiseScale },
				u_noiseSpeed: { value: outerCubeState.noiseSpeed }
			}),
			vertexShader: vertexShaderDefines + depth.vertexShader.replace('#include <project_vertex>', project_vertex),
			fragmentShader: depth.fragmentShader,

			defines: {
				DEPTH_PACKING: THREE.RGBADepthPacking
			}
		})
	}, [])

	useEffect(() => {
		meshRef.current!.customDepthMaterial = depthMaterial
	}, [depthMaterial])

	// --------------------------------------------
	// frame loop

	useFrame(() => {
		if (material.userData.shader) {
			const shader = material.userData.shader as THREE.Shader
			shader.uniforms.u_time.value += 0.005
			shader.uniforms.u_noiseScale.value = outerCubeState.noiseScale
			shader.uniforms.u_noiseSpeed.value = outerCubeState.noiseSpeed

			depthMaterial.uniforms.u_time.value += 0.005
			depthMaterial.uniforms.u_noiseScale.value = outerCubeState.noiseScale
			depthMaterial.uniforms.u_noiseSpeed.value = outerCubeState.noiseSpeed
		}

		meshRef.current!.receiveShadow = outerCubeState.receiveShadow
	})

	return <instancedMesh ref={meshRef} args={[geometry, material, amount]} castShadow />
}

const vertexShaderDefines = `
uniform float u_time;
uniform float u_noiseScale;
uniform float u_noiseSpeed;
attribute vec3 a_pos;
varying float v_noise;

${cnoise31}
`

const project_vertex = `
float n = cnoise31(a_pos * u_noiseScale + u_time * u_noiseSpeed);
n += 0.5;
n = smoothstep(0.0, 1.0, n);
transformed *= n;

v_noise = n;

vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif

mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`

const fragmentShaderDefines = `
varying float v_noise;
`

const color_fragment = `
#include <color_fragment>
diffuseColor.rgb *= v_noise;
`
