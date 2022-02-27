import { useRef, VFC } from 'react';
import * as THREE from 'three';

export const Lights: VFC = () => {
	const ref = useRef<THREE.DirectionalLight>(null)

	// const { scene } = useThree()
	// useEffect(() => {
	// 	const helper = new THREE.CameraHelper(ref.current!.shadow.camera)
	// 	scene.add(helper)
	// }, [scene])

	return (
		<>
			<ambientLight intensity={0.1} />
			<directionalLight
				ref={ref}
				position={[30, 30, 30]}
				shadow-camera-far={100}
				shadow-camera-top={20}
				shadow-camera-bottom={-20}
				shadow-camera-left={-20}
				shadow-camera-right={20}
				castShadow
				shadow-mapSize={[2048, 2048]}
			/>
		</>
	)
}
