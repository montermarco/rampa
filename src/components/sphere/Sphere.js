import { useRef } from 'react';
import * as THREE from 'three';
import bgFragmentShader from '../../shaders/bgFragment';
import bgVertexShader from '../../shaders/bgVertex';
import { shaderMaterial, Float } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

const PortalMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorStart: new THREE.Color('#1D04BF'),
    uColorEnd: new THREE.Color('#fff'),
  },
  bgVertexShader,
  bgFragmentShader
);

extend({ PortalMaterial });

function Sphere() {
  const portalMaterial = useRef();
  useFrame((state, delta) => {
    portalMaterial.current.uTime += delta;
  });

  return (
    <>
      <Float speed={2} rotationIntensity={3} floatIntensity={5}>
        <mesh>
          <sphereGeometry args={[1.5, 32, 32]} />
          <portalMaterial ref={portalMaterial} />
        </mesh>
      </Float>
    </>
  );
}

export default Sphere;
