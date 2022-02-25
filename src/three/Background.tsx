import { VFC } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

export const Background: VFC<{ color: THREE.ColorRepresentation }> = ({ color }) => {
	const { scene } = useThree()
	const bgColor = new THREE.Color(color)
	bgColor.convertSRGBToLinear()
	scene.background = bgColor
	return null
}
