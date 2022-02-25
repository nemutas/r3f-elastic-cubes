import { VFC } from 'react';
import { ContactShadows, OrbitControls, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Background } from './Background';
import { Cubes } from './Cubes';
import { Lights } from './Lights';
import { Effects } from './postprocessing/Effects';
import { FocusPass } from './postprocessing/FocusPass';
import { FXAAPass } from './postprocessing/FXAAPass';

export const TCanvas: VFC = () => {
	return (
		<Canvas
			camera={{
				position: [0, 3, 22],
				fov: 50,
				aspect: window.innerWidth / window.innerHeight,
				near: 0.1,
				far: 2000
			}}
			dpr={window.devicePixelRatio}
			shadows
			onCreated={({ camera }) => camera.lookAt(0, -5, 0)}>
			{/* scene */}
			<Background color="#88bedf" />
			{/* camera controller */}
			<OrbitControls attach="orbitControls" enablePan={false} enableRotate={false} />
			{/* lights */}
			<Lights />
			<ContactShadows
				rotation={[Math.PI / 2, 0, 0]}
				position={[0, -10, 0]}
				opacity={1}
				width={50}
				height={50}
				blur={3}
				far={10}
			/>
			{/* objects */}
			<Cubes />
			{/* effects */}
			<Effects sRGBCorrection>
				<FXAAPass />
				<FocusPass />
			</Effects>
			{/* helper */}
			<Stats />
		</Canvas>
	)
}
